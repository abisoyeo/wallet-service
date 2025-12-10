# 💳 Secure Wallet Service API

## Overview

This project is a robust NestJS backend application implementing a polymorphic authentication pattern, designed for managing user and service identities. It integrates secure API key management, Google OAuth for user authentication, and a comprehensive wallet system with Paystack payment gateway integration for deposits and transfers, all backed by MongoDB.

## Features

- **Polymorphic Authentication**: Unified identity handling for both users (JWT) and services (API Keys).
- **Secure API Key Management**: Generate, rollover, revoke, and manage API keys with granular permissions and expiry.
- **Google OAuth Integration**: Seamless user authentication via Google accounts.
- **User Authentication**: Standard email/password signup and login with JWT.
- **Wallet System**: Dedicated user wallets with balance tracking.
- **Paystack Integration**: Initiate and handle deposits via Paystack's payment gateway and webhooks.
- **Fund Transfers**: Securely transfer funds between internal wallets with atomic transactions.
- **Transaction History**: Comprehensive logging and retrieval of all wallet transactions.
- **Permissions Control**: Granular access control for API keys using custom permission guards.

## Technologies Used

| Technology      | Description                                                                                            | Link                                                             |
| :-------------- | :----------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **Node.js**     | JavaScript runtime environment                                                                         | [nodejs.org](https://nodejs.org/)                                |
| **NestJS**      | Progressive Node.js framework for building efficient, reliable, and scalable server-side applications. | [nestjs.com](https://nestjs.com/)                                |
| **TypeScript**  | Superset of JavaScript that compiles to plain JavaScript.                                              | [typescriptlang.org](https://www.typescriptlang.org/)            |
| **MongoDB**     | NoSQL document database.                                                                               | [mongodb.com](https://www.mongodb.com/)                          |
| **Mongoose**    | MongoDB object data modeling (ODM) for Node.js.                                                        | [mongoosejs.com](https://mongoosejs.com/)                        |
| **Passport.js** | Authentication middleware for Node.js.                                                                 | [passportjs.org](http://www.passportjs.org/)                     |
| **bcrypt**      | Library for hashing passwords.                                                                         | [npmjs.com/package/bcrypt](https://www.npmjs.com/package/bcrypt) |
| **Paystack**    | Online payment gateway for Africa.                                                                     | [paystack.com](https://paystack.com/)                            |
| **JWT**         | JSON Web Tokens for secure information transmission.                                                   | [jwt.io](https://jwt.io/)                                        |
| **Axios**       | Promise-based HTTP client for the browser and Node.js.                                                 | [axios-http.com](https://axios-http.com/)                        |

## Getting Started

To get this project up and running on your local machine, follow these steps.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/abisoyeo/wallet-service.git
    cd wallet-service
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Build the project**:
    ```bash
    npm run build
    ```

### Environment Variables

Create a `.env` file in the root directory and populate it with the following required variables:

- `MONGO_URI`: Your MongoDB connection string.
  _Example_: `mongodb://localhost:27017/wallet_db`
- `JWT_SECRET`: A strong secret key for signing JWTs.
  _Example_: `your_jwt_super_secret_key_here`
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID.
  _Example_: `1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret.
  _Example_: `GOCSPX-ABCDEFGH1234567890_abcdefgh`
- `GOOGLE_CALLBACK_URL`: The callback URL for your Google OAuth integration.
  _Example_: `http://localhost:3000/auth/google/callback`
- `PAYSTACK_SECRET_KEY`: Your Paystack secret key for initiating transactions and verifying webhooks.
  _Example_: `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx`
- `PORT`: (Optional) The port the server will listen on. Defaults to `3000`.
  _Example_: `3000`

## Usage

### Running the Application

To start the application in different modes:

- **Development mode (with watch)**:
  ```bash
  npm run start:dev
  ```
- **Production mode**:
  ```bash
  npm run start:prod
  ```
- **Debug mode**:
  ```bash
  npm run start:debug
  ```

### Interacting with the API

Once the server is running, you can interact with the API using a tool like Postman, Insomnia, or `curl`. Ensure you include the correct headers for authentication (Bearer Token for user authentication, `x-api-key` for service authentication).

## API Documentation

### Base URL

`http://localhost:3000` (or your configured `PORT`)

### Authentication

This API supports two main authentication strategies:

1.  **JSON Web Token (JWT) for Users**:
    - Obtained after successful user login (`POST /auth/login` or Google OAuth).
    - Sent in the `Authorization` header as a Bearer token: `Authorization: Bearer <your_jwt_token>`
2.  **API Key for Services**:
    - Generated via the `/keys/create` endpoint.
    - Sent in the `x-api-key` header: `x-api-key: <your_service_api_key>`
    - API keys can have specific permissions (e.g., `read`, `deposit`, `transfer`). Endpoints requiring API keys will enforce these permissions.

---

### Endpoints

#### POST /auth/signup

Registers a new user with email and password.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "_id": "65b7d9e2a1b3c4d5e6f7a8b9",
    "email": "user@example.com"
  }
}
```

**Errors**:

- 409 Conflict: Email already in use.

---

#### POST /auth/login

Authenticates an existing user and returns a JWT.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "_id": "65b7d9e2a1b3c4d5e6f7a8b9",
    "email": "user@example.com"
  }
}
```

**Errors**:

- 401 Unauthorized: Invalid credentials or account created via Google.

---

#### GET /auth/google

Initiates the Google OAuth login flow. Redirects to Google's authentication page.

**Request**: (No direct request body or params, handled by browser redirect)

**Response**: (Redirects to Google, then `GOOGLE_CALLBACK_URL`)

**Errors**: (Internal server errors related to misconfigured Google OAuth)

---

#### GET /auth/google/callback

Handles the redirect from Google OAuth after successful authentication.

**Request**: (No direct request body, receives authorization code from Google)

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "_id": "65b7d9e2a1b3c4d5e6f7a8b9",
    "email": "google.user@example.com"
  }
}
```

**Errors**:

- 401 Unauthorized: Failed Google authentication.

---

#### POST /auth/logout

Revokes the current JWT or deactivates the API key.

**Request**: (Requires `Authorization: Bearer <token>` or `x-api-key: <key>`)
(No request body)

**Response**:

```json
{
  "message": "User logged out — token revoked"
}
```

_or_

```json
{
  "message": "API key with prefix sk_live_abcde successfully revoked"
}
```

**Errors**:

- 401 Unauthorized: Invalid or missing token/API key.

---

#### GET /protected/hybrid

Example protected route accessible by both authenticated users (JWT) and services (API Key).

**Request**: (Requires `Authorization: Bearer <token>` or `x-api-key: <key>`)
(No request body)

**Response**:
_If user authenticated:_

```json
"Hello User: user@example.com"
```

_If service authenticated:_

```json
"Hello Service: My Awesome Service"
```

**Errors**:

- 401 Unauthorized: Invalid or missing token/API key.

---

#### GET /protected/service-only

Example protected route accessible only by services using an API Key.

**Request**: (Requires `x-api-key: <key>`)
(No request body)

**Response**:

```json
{
  "message": "Hello from My Awesome Service",
  "serviceId": "65b7d9e2a1b3c4d5e6f7a8b9",
  "type": "service"
}
```

**Errors**:

- 401 Unauthorized: Invalid or missing API key.
- 403 Forbidden: Attempted access with JWT.

---

#### GET /protected/user-only

Example protected route accessible only by authenticated users (JWT).

**Request**: (Requires `Authorization: Bearer <token>`)
(No request body)

**Response**:

```json
{
  "message": "Hello from user@example.com",
  "userId": "65b7d9e2a1b3c4d5e6f7a8b9",
  "type": "user"
}
```

**Errors**:

- 401 Unauthorized: Invalid or missing token.
- 403 Forbidden: Attempted access with API Key.

---

#### POST /keys/create

Creates a new API key for the authenticated user.

**Request**: (Requires `Authorization: Bearer <token>`)

```json
{
  "name": "My New Service Key",
  "permissions": ["read", "deposit"],
  "expiry": "1M",
  "environment": "test"
}
```

_`expiry` can be `1H` (1 Hour), `1D` (1 Day), `1M` (1 Month), or `1Y` (1 Year)._
_`environment` can be `live` or `test`. Defaults to `live`._

**Response**:

```json
{
  "message": "API key created successfully",
  "permissions": ["read", "deposit"],
  "name": "My New Service Key",
  "key_prefix": "sk_test_abcdefghijk",
  "masked_key": "sk_test_...hijkl",
  "api_key": "sk_test_abcdefghijklmnopqrstuvwxyz1234567890",
  "environment": "test",
  "expires_at": "2024-03-30T10:00:00.000Z",
  "_id": "65b7d9e2a1b3c4d5e6f7a8b9"
}
```

**Errors**:

- 409 Conflict: Limit reached (max 5 active API keys per user) or service name already in use.
- 400 BadRequest: Invalid expiry format.
- 401 Unauthorized: Missing or invalid JWT.

---

#### POST /keys/rollover

Generates a new API key based on an expired key, effectively replacing it.

**Request**: (Requires `Authorization: Bearer <token>`)

```json
{
  "expired_key_id": "65b7d9e2a1b3c4d5e6f7a8b9",
  "expiry": "1Y"
}
```

_`expiry` can be `1H`, `1D`, `1M`, or `1Y`._

**Response**:

```json
{
  "message": "Key rolled over successfully",
  "api_key": "sk_live_newkeyp",
  "masked_key": "sk_live_...uvwxyz",
  "permissions": ["read", "deposit"],
  "environment": "live",
  "expires_at": "2025-02-29T10:00:00.000Z",
  "_id": "65c8e0f3a2b4c5d6e7f8a9b0"
}
```

**Errors**:

- 404 NotFound: Key not found or does not belong to the user.
- 400 BadRequest: Key is not yet expired.
- 409 Conflict: Limit reached for active API keys.
- 401 Unauthorized: Missing or invalid JWT.

---

#### POST /keys/:keyPrefix/revoke

Revokes an active API key, making it unusable.

**Request**: (Requires `Authorization: Bearer <token>`)
_Path Parameter_: `keyPrefix` - The prefix of the API key to revoke (e.g., `sk_test_abcde`)
(No request body)

**Response**:

```json
{
  "message": "API key with prefix sk_test_abcde successfully revoked"
}
```

**Errors**:

- 401 Unauthorized: Missing or invalid JWT.

---

#### GET /keys

Retrieves all active API keys for the authenticated user (masked).

**Request**: (Requires `Authorization: Bearer <token>`)
(No request body)

**Response**:

```json
{
  "message": "1 API key(s) retrieved successfully",
  "data": [
    {
      "_id": "65b7d9e2a1b3c4d5e6f7a8b9",
      "owner": "65a6f8e7d9c1b0a2f3e4d5c6",
      "keyPrefix": "sk_test_abcdefghijk",
      "name": "My New Service Key",
      "permissions": ["read", "deposit"],
      "environment": "test",
      "isActive": true,
      "expiresAt": "2024-03-30T10:00:00.000Z",
      "maskedKey": "sk_test_...hijkl"
    }
  ]
}
```

_If no keys found:_

```json
{
  "message": "No API keys found",
  "data": []
}
```

**Errors**:

- 401 Unauthorized: Missing or invalid JWT.

---

#### DELETE /keys/:keyPrefix

Deletes an API key permanently.

**Request**: (Requires `Authorization: Bearer <token>`)
_Path Parameter_: `keyPrefix` - The prefix of the API key to delete.
(No request body)

**Response**:

```json
{
  "message": "API key with prefix sk_test_abcde successfully deleted"
}
```

_If key not found:_

```json
{
  "message": "API key with prefix sk_test_abcde not found"
}
```

**Errors**:

- 401 Unauthorized: Missing or invalid JWT.

---

#### POST /wallet/deposit

Initiates a deposit transaction through Paystack. Requires `deposit` permission for API keys.

**Request**: (Requires `Authorization: Bearer <token>` or `x-api-key: <key>` with `deposit` permission)

```json
{
  "amount": 5000
}
```

**Response**:

```json
{
  "authorization_url": "https://checkout.paystack.com/abcdefgh123",
  "access_code": "abcdefgh123",
  "reference": "your_paystack_transaction_reference"
}
```

**Errors**:

- 400 BadRequest: Invalid amount (must be positive).
- 401 Unauthorized: Invalid/missing token/API key.
- 403 Forbidden: Insufficient API Key permissions (`deposit` required).
- 500 InternalServerError: Paystack initialization failed.

---

#### POST /wallet/paystack/webhook

Endpoint for Paystack to send transaction success notifications.

**Request**: (Sent by Paystack, `x-paystack-signature` header required)

```json
{
  "event": "charge.success",
  "data": {
    "reference": "your_paystack_transaction_reference",
    "amount": 500000,
    "status": "success",
    "customer": {
      "email": "user@example.com"
    },
    "...": "other paystack data"
  }
}
```

**Response**:

```json
{
  "status": true
}
```

**Errors**:

- 403 Forbidden: Invalid `x-paystack-signature`.
- (Other errors might occur but are typically handled internally with logging as webhooks should always return 200/201 quickly).

---

#### GET /wallet/deposit/:reference/status

Checks the status of a specific deposit transaction.

**Request**: (Requires `Authorization: Bearer <token>` or `x-api-key: <key>`)
_Path Parameter_: `reference` - The transaction reference from Paystack.
(No request body)

**Response**:

```json
{
  "message": "Implement read-only logic here"
}
```

_Note: The current implementation provides a placeholder message. For full functionality, this endpoint would query the database for the transaction status._

**Errors**:

- 401 Unauthorized: Invalid/missing token/API key.
- 403 Forbidden: Insufficient API Key permissions (if `read` or similar is added).

---

#### GET /wallet/balance

Retrieves the current balance of the authenticated user's wallet. Requires `read` permission for API keys.

**Request**: (Requires `Authorization: Bearer <token>` or `x-api-key: <key>` with `read` permission)
(No request body)

**Response**:

```json
{
  "balance": 12500
}
```

**Errors**:

- 401 Unauthorized: Invalid/missing token/API key.
- 403 Forbidden: Insufficient API Key permissions (`read` required).

---

#### POST /wallet/transfer

Transfers funds from the authenticated user's wallet to another internal wallet. Requires `transfer` permission for API keys.

**Request**: (Requires `Authorization: Bearer <token>` or `x-api-key: <key>` with `transfer` permission)

```json
{
  "wallet_number": "9876543210",
  "amount": 2500
}
```

**Response**:

```json
{
  "status": "success",
  "message": "Transfer completed"
}
```

**Errors**:

- 400 BadRequest: Amount must be positive or insufficient funds.
- 404 NotFound: Recipient wallet not found.
- 401 Unauthorized: Invalid/missing token/API key.
- 403 Forbidden: Insufficient API Key permissions (`transfer` required).

---

#### GET /wallet/transactions

Retrieves the transaction history for the authenticated user's wallet. Requires `read` permission for API keys.

**Request**: (Requires `Authorization: Bearer <token>` or `x-api-key: <key>` with `read` permission)
(No request body)

**Response**:

```json
[
  {
    "_id": "65b7d9e2a1b3c4d5e6f7a8b9",
    "userId": "65a6f8e7d9c1b0a2f3e4d5c6",
    "reference": "paystack_ref_12345",
    "type": "deposit",
    "amount": 5000,
    "status": "success",
    "createdAt": "2024-01-30T10:00:00.000Z",
    "updatedAt": "2024-01-30T10:05:00.000Z"
  },
  {
    "_id": "65c8e0f3a2b4c5d6e7f8a9b0",
    "userId": "65a6f8e7d9c1b0a2f3e4d5c6",
    "reference": "internal_transfer_uuid_abc",
    "type": "transfer",
    "amount": -2500,
    "status": "success",
    "recipientWalletNumber": "9876543210",
    "createdAt": "2024-02-01T11:00:00.000Z",
    "updatedAt": "2024-02-01T11:00:00.000Z"
  }
]
```

**Errors**:

- 401 Unauthorized: Invalid/missing token/API key.
- 403 Forbidden: Insufficient API Key permissions (`read` required).

---

## License

This project is currently UNLICENSED. Please refer to the `package.json` for license details.

## Author

**Abisoye Ogunmona**

Connect with me:

- LinkedIn: [Your_LinkedIn_Profile]
- Twitter: [Your_Twitter_Handle]
- Portfolio: [Your_Portfolio_Link]

## Badges

[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%234EA94B.svg?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-800000?style=for-the-badge&logo=mongoose&logoColor=white)](https://mongoosejs.com)
[![Paystack](https://img.shields.io/badge/Paystack-00C3F7?style=for-the-badge&logo=paystack&logoColor=white)](https://paystack.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)
