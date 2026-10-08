# Security Specification & Test Cases

This document defines the security boundaries, data invariants, and the test payload scenarios to audit and harden the Firestore security rules.

## 1. Data Invariants

1. **Customers & Users**:
   - Standard clients can read and write only their own user profile document in `/customers/{customerId}`.
   - Clients cannot modify their own `role` or escalate privileges (e.g., from client to admin).
   - Only administrators (checked via a trusted database document `/admins/{userId}` or `/customers/{customerId}` where `role == 'admin'`) can view and update other clients' profiles and balances.

2. **Products & Catalog**:
   - Anyone (authenticated or not) can read the `/products` catalog and `/payment_methods`.
   - Only administrators can create, update, or delete products and payment methods.

3. **Orders**:
   - Authenticated users can create orders for themselves (owner email matching their account email).
   - Clients can only read their own orders.
   - Standard clients cannot modify an order's state once placed, nor can they alter credentials inside `accountCredentials` or the `status` field.
   - Only administrators can update orders (to transition status, assign credentials, etc.).

4. **Wallet Topups**:
   - Clients can create topups for themselves and read their own topups.
   - Clients cannot modify topups once created.
   - Only administrators can update topups (e.g., to approve or reject them).

5. **Incidents**:
   - Clients can create and read their own incidents.
   - Only administrators can see all incidents and update them.

6. **Branding & Global Settings**:
   - Anyone can read the `/config/branding` document.
   - Only administrators can modify `/config/branding` or the `/config/bcv` rate.

---

## 2. The "Dirty Dozen" Payloads (Red Team Audit Cases)

These are malicious attempts designed to bypass access controls and corrupt application integrity. They MUST be rejected by the security rules:

1. **Self-Escalation**: A standard client attempts to create or update their profile with `role: "admin"`.
2. **Catalog Sabotage**: An unauthenticated user attempts to delete a product.
3. **Price Manipulation**: An unauthorized user attempts to update a product price to $0.
4. **Order Siphoning**: A client attempts to read another client's order by document ID guessing.
5. **Credential Tampering**: A client attempts to update an order's `accountCredentials` field directly on their own order.
6. **Fake Balance Topup**: A client attempts to directly update their `zenyBalance` in their own user profile document.
7. **Status Jumping**: A client attempts to set their order's `status` to `'completed'` or `'entregado'` during creation.
8. **Impersonated Wallet Topup**: A client attempts to submit a wallet topup with another user's email.
9. **Topup Verification Bypass**: A client attempts to update a wallet topup status directly to `'approved'`.
10. **Branding Hijack**: An unauthenticated user attempts to update the primary color and project name in `/config/branding`.
11. **Tasa BCV Sabotage**: An unauthorized user attempts to set `/config/bcv` rate to `999,999.00`.
12. **Incident Interception**: A client attempts to view support incidents submitted by other customers.

---

## 3. Test Cases (Concept Rules)

- All reads to administrative collections must return `PERMISSION_DENIED` for standard users.
- All write attempts matching the "Dirty Dozen" must return `PERMISSION_DENIED`.
- Authorized standard operations (e.g. creating an order, registering profile, viewing catalog) must return `SUCCESS`.
