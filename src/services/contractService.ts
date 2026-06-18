/**
 * Mobile Contract Service with Offline Fallback and Queueing
 * Handles contract transactions with local queueing for offline scenarios
 */

import { ContractTransaction, ContractSubmissionResult, ContractArg } from "./contractSubmission";

// Database schema for local queueing
interface QueuedTransaction {
  id: string;
  contractId: string;
  functionName: string;
  args: ContractArg[];
  simulatedEnvelope?: string;
  status: "queued" | "submitted" | "confirmed" | "failed";
  attemptCount: number;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
  transactionHash?: string;
}

/**
 * Mobile Contract Service
 * Provides offline-first transaction handling with local database persistence
 */
export class MobileContractService {
  private readonly backendUrl: string;
  private readonly dbName: string = "StellarInsights";
  private readonly storeName: string = "transactions";
  private readonly maxQueuedRetries: number = 5;
  private readonly queueRetryIntervalMs: number = 5000;
  private isOnline: boolean = navigator.onLine;
  private db: IDBDatabase | null = null;

  constructor(backendUrl: string = process.env.REACT_APP_API_URL || "http://localhost:3000") {
    this.backendUrl = backendUrl;
    this.initializeDatabase();
    this.setupOnlineListener();
  }

  /**
   * Initialize IndexedDB for transaction queueing
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  }

  /**
   * Setup listener for online/offline changes
   */
  private setupOnlineListener(): void {
    window.addEventListener("online", () => {
      console.log("[MobileContractService] Network online - processing queue");
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener("offline", () => {
      console.log("[MobileContractService] Network offline - queuing transactions");
      this.isOnline = false;
    });
  }

  /**
   * Submit a contract transaction with offline fallback
   */
  async submitTransaction(request: {
    contractId: string;
    functionName: string;
    args: ContractArg[];
  }): Promise<ContractSubmissionResult> {
    const transaction: QueuedTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contractId: request.contractId,
      functionName: request.functionName,
      args: request.args,
      status: "queued",
      attemptCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Try to submit immediately if online
    if (this.isOnline) {
      const result = await this.attemptSubmission(transaction);
      if (result.success) {
        return result;
      }
      // If failed and retryable, queue for later
      if (result.retryable) {
        console.log("[MobileContractService] Submission failed but retryable - queueing");
        await this.queueTransaction(transaction);
      }
      return result;
    }

    // Queue for later if offline
    console.log("[MobileContractService] Offline - queueing transaction");
    await this.queueTransaction(transaction);

    return {
      success: false,
      error: "Device is offline - transaction queued for later submission",
      retryable: true,
    };
  }

  /**
   * Attempt to submit a transaction to the backend
   */
  private async attemptSubmission(transaction: QueuedTransaction): Promise<ContractSubmissionResult> {
    try {
      transaction.attemptCount++;
      transaction.updatedAt = Date.now();

      // Simulate transaction if not already done
      if (!transaction.simulatedEnvelope) {
        const simulated = await this.simulateTransaction(transaction);
        if (!simulated) {
          throw new Error("Simulation failed");
        }
        transaction.simulatedEnvelope = simulated;
      }

      // Submit to backend
      const response = await fetch(`${this.backendUrl}/api/v1/contracts/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionData: transaction.simulatedEnvelope,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Backend error: ${error.message}`);
      }

      const result = await response.json();
      transaction.status = "submitted";
      transaction.transactionHash = result.hash;

      await this.updateQueuedTransaction(transaction);

      // Poll for confirmation
      const confirmed = await this.pollForConfirmation(result.hash);
      if (confirmed) {
        transaction.status = "confirmed";
        await this.updateQueuedTransaction(transaction);
      }

      return {
        success: confirmed,
        transactionHash: result.hash,
        retryable: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      transaction.lastError = message;
      transaction.updatedAt = Date.now();

      // Determine if retryable
      const retryable = this.isRetryableError(error);

      if (retryable && transaction.attemptCount < this.maxQueuedRetries) {
        transaction.status = "queued";
      } else {
        transaction.status = "failed";
      }

      await this.updateQueuedTransaction(transaction);

      return {
        success: false,
        error: message,
        retryable: retryable && transaction.attemptCount < this.maxQueuedRetries,
      };
    }
  }

  /**
   * Simulate a transaction
   */
  private async simulateTransaction(transaction: QueuedTransaction): Promise<string | null> {
    try {
      const response = await fetch(`${this.backendUrl}/api/v1/contracts/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: transaction.contractId,
          functionName: transaction.functionName,
          args: transaction.args,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.transactionData;
    } catch (error) {
      console.error("[MobileContractService] Simulation error:", error);
      return null;
    }
  }

  /**
   * Poll for transaction confirmation
   */
  private async pollForConfirmation(transactionHash: string): Promise<boolean> {
    const maxAttempts = 60; // 60 seconds with 1s interval
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(
          `${this.backendUrl}/api/v1/contracts/status/${transactionHash}`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.status === "success") {
            return true;
          }
          if (result.status === "failed") {
            return false;
          }
        }
      } catch (error) {
        // Continue polling even if status check fails
      }

      await this.delay(1000);
    }

    return false; // Timeout
  }

  /**
   * Queue a transaction for later submission
   */
  private async queueTransaction(transaction: QueuedTransaction): Promise<void> {
    if (!this.db) {
      console.error("[MobileContractService] Database not initialized");
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.add(transaction);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`[MobileContractService] Transaction queued: ${transaction.id}`);
        resolve();
      };
    });
  }

  /**
   * Update a queued transaction
   */
  private async updateQueuedTransaction(transaction: QueuedTransaction): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.put(transaction);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get queued transactions
   */
  async getQueuedTransactions(): Promise<QueuedTransaction[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.storeName], "readonly");
      const store = tx.objectStore(this.storeName);
      const index = store.index("status");
      const request = index.getAll("queued");

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Process queued transactions
   */
  async processQueue(): Promise<void> {
    const queued = await this.getQueuedTransactions();

    for (const transaction of queued) {
      if (!this.isOnline) {
        console.log("[MobileContractService] Network went offline - stopping queue processing");
        break;
      }

      console.log(`[MobileContractService] Processing queued transaction: ${transaction.id}`);
      await this.attemptSubmission(transaction);

      // Delay between submissions
      await this.delay(this.queueRetryIntervalMs);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(id: string): Promise<QueuedTransaction | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.storeName], "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Clear old completed transactions
   */
  async clearCompletedTransactions(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const cutoffTime = Date.now() - olderThanMs;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);
      const index = store.index("status");
      const request = index.getAll("confirmed");

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result || [];
        const deleteRequests = results
          .filter((t) => t.updatedAt < cutoffTime)
          .map((t) => store.delete(t.id));

        Promise.all(deleteRequests).then(() => resolve());
      };
    });
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    // Network errors
    if (message.includes("network") || message.includes("fetch")) {
      return true;
    }

    // Transient errors
    if (message.includes("timeout") || message.includes("temporarily")) {
      return true;
    }

    // Server errors
    if (message.includes("500") || message.includes("503")) {
      return true;
    }

    return false;
  }

  /**
   * Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * React Hook for Mobile Contract Service
 */
import { useEffect, useState } from "react";

export function useMobileContractService() {
  const [service] = useState(() => new MobileContractService());
  const [queuedCount, setQueuedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      service.processQueue();
    }
  }, [isOnline, service]);

  const updateQueuedCount = async () => {
    const queued = await service.getQueuedTransactions();
    setQueuedCount(queued.length);
  };

  useEffect(() => {
    updateQueuedCount();
    const interval = setInterval(updateQueuedCount, 5000);
    return () => clearInterval(interval);
  }, [service]);

  return {
    service,
    queuedCount,
    isOnline,
  };
}
