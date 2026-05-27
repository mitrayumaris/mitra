# Security Spec for Tahfidz Coding Sales Portal

## 1. Data Invariants
- An authenticated partner can browse products and configure their own accounts.
- Anyone (unauthenticated student/buyer) can read products and submit a registration transaction.
- Only corresponding account owners or admin can read/write their withdrawal requests and tahfidz progress.
- Only admin level accounts can edit configuration, verify transactions, or complete withdrawals.

## 2. Dirty Dozen Malicious Payloads
1. Attempting to overwrite admin registration percent from client.
2. Registering account with admin role spoofing.
3. Accessing another user's private address or phone details.
4. Completing your own withdrawal request without transfers.
5. Injected JS payloads in product names.
6. Deleting transaction records.
7. Changing payment status of transaction from `pending` to `verified` as a guest or standard agent.
8. Initiating a withdrawal of negative funds.
9. Initiating a withdrawal exceeding actual balance.
10. Spoofing ownerId to someone else's ID.
11. Reading private PII of other partners by random guests.
12. Creating products with missing required fields like category.

## 3. Test Cases Draft
Verify that permissions are strictly constrained. Valid checks happen inside `firestore.rules`.
