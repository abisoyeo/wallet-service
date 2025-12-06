# **Polymorphic Authentication System API**

A versatile NestJS backend designed to handle both user and service authentication seamlessly. This project showcases a powerful polymorphic identity pattern, ensuring secure and flexible access control across your application ecosystem. Built with TypeScript, NestJS, and Mongoose, it's ready for scalable microservice architectures!

## Overview

This NestJS application provides a robust polymorphic authentication system, enabling unified identity handling for both traditional users via JWT and external microservices via API keys, leveraging MongoDB with Mongoose for data persistence.

## Features

- **NestJS**: Modular server-side framework for building efficient and scalable APIs.
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB, simplifying data interaction.
- **Passport.js**: Authentication middleware providing flexible strategies for JWT and API Keys.
- **Bcrypt**: Cryptographic hashing function for secure storage of user passwords and API key hashes.
- **JWT (JSON Web Tokens)**: Standardized, token-based authentication for user sessions, ensuring secure stateless communication.
- **API Keys**: A dedicated mechanism for secure, revocable service-to-service authentication.
- **Polymorphic Identity**: A unified `CurrentIdentity` decorator to seamlessly access authenticated user or service context.

## Getting Started

### Installation

To get this project up and running on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/abisoyeo/polymorphic-auth-sytem.git
    cd polymorphic-auth-sytem
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
3.  **Configure environment variables:**
    Create a `.env` file in the root directory and add the following:
    ```
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/authdb_polymorphic
    JWT_SECRET=your_super_secret_jwt_key_here
    ```
4.  **Run the application:**
    - **Development mode (with watch):**
      ```bash
      npm run start:dev
      ```
    - **Production mode (build then start):**
      `bash
    npm run build
    npm run start:prod
    `
      The API will be accessible at `http://localhost:3000` (or your chosen PORT).

### Environment Variables

- `PORT`: The port on which the NestJS application will listen.
  Example: `PORT=3000`
- `MONGO_URI`: The connection string for your MongoDB instance.
  Example: `MONGO_URI=mongodb://localhost:27017/authdb_polymorphic`
- `JWT_SECRET`: A secret key used to sign and verify JWTs. This should be a strong, random string.
  Example: `JWT_SECRET=thisisasecretkeyforjwt`

## API Documentation

### Base URL

The base URL for all API endpoints is `http://localhost:3000` (or the port configured in your `.env` file).

### Endpoints

#### POST /auth/signup

Registers a new user with an email and password.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response**:

```json
{
  "_id": "65e23e59a1b2c3d4e5f67890",
  "email": "user@example.com",
  "password": "$2b$10$abcdefghijklmnopqrstuvwxyzabcdefghi..."
}
```

**Errors**:

- `400 Bad Request`: If request payload is invalid or missing required fields.
- `409 Conflict`: If a user with the provided email already exists.

#### POST /auth/login

Authenticates a user and returns a JSON Web Token (JWT).

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJzdWIiOiI2NWUyM2U1OWExYjJjM2Q0ZTVmNjc4OTAiLCJpYXQiOjE2Nzg5OTg0MDAsImV4cCI6MTY3OTAwMjAwMH0.some_jwt_signature"
}
```

**Errors**:

- `400 Bad Request`: If request payload is invalid or missing required fields.
- `401 Unauthorized`: If the provided email or password is incorrect.

#### POST /keys/create

Generates a new API key for a specified service. This endpoint requires authentication with a JWT.

**Request**:

```json
{
  "serviceName": "AnalyticsService"
}
```

**Response**:

```json
{
  "apiKey": "f7a3e8d2b1c6a0f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8f7e6d5",
  "serviceName": "AnalyticsService",
  "expiresAt": "2024-03-30T10:00:00.000Z"
}
```

**Errors**:

- `400 Bad Request`: If request payload is invalid or `serviceName` is missing.
- `401 Unauthorized`: If no valid JWT is provided in the `Authorization` header.

#### GET /protected/hybrid

An example endpoint demonstrating polymorphic authentication, accessible by either a valid JWT (for users) or an API Key (for services).

**Request**:
_Via JWT (in `Authorization` header):_

```
Authorization: Bearer <your_jwt_token>
```

_Via API Key (in `x-api-key` header):_

```
x-api-key: <your_api_key>
```

**Response**:
_If authenticated as a user:_

```json
"Hello User: user@example.com"
```

_If authenticated as a service:_

```json
"Hello Service: AnalyticsService"
```

**Errors**:

- `401 Unauthorized`: If no valid JWT or API Key is provided, or if they are invalid/expired.

#### GET /protected/service-only

An example endpoint accessible exclusively by services using a valid API Key.

**Request**:
_Via API Key (in `x-api-key` header):_

```
x-api-key: <your_api_key>
```

**Response**:

```json
{
  "message": "This is specific to microservice communication"
}
```

**Errors**:

- `401 Unauthorized`: If no valid API Key is provided, or if the key is invalid/expired.

---

## Usage

This API provides distinct authentication flows for human users and automated services. Below are examples of how to interact with the various endpoints.

### User Authentication (JWT):

1.  **Sign Up:** Create a new user account.

    ```bash
    curl -X POST http://localhost:3000/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "SecurePassword123"}'
    ```

    _Expected Response:_ `{"_id":"...", "email":"user@example.com", "password":"$2b$..."}`

2.  **Login:** Obtain a JWT for subsequent requests.
    ```bash
    curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "SecurePassword123"}'
    ```
    _Expected Response:_ `{"access_token":"eyJ..."}`

### Service Authentication (API Key):

1.  **Create API Key (User Role Required):** First, log in as a user to get a JWT, then use that JWT to create a service API key.

    ```bash
    # Assume you have a JWT_TOKEN from user login
    JWT_TOKEN="eyJ..."

    curl -X POST http://localhost:3000/keys/create \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -d '{"serviceName": "AnalyticsService"}'
    ```

    _Expected Response:_ `{"apiKey":"...", "serviceName":"AnalyticsService", "expiresAt":"..."}`

### Accessing Protected Resources:

1.  **Hybrid Protected Endpoint (User via JWT):**

    ```bash
    # Assume you have a JWT_TOKEN from user login
    JWT_TOKEN="eyJ..."

    curl -X GET http://localhost:3000/protected/hybrid \
    -H "Authorization: Bearer ${JWT_TOKEN}"
    ```

    _Expected Response:_ `"Hello User: user@example.com"`

2.  **Hybrid Protected Endpoint (Service via API Key):**

    ```bash
    # Assume you have an API_KEY
    API_KEY="your-generated-api-key"

    curl -X GET http://localhost:3000/protected/hybrid \
    -H "x-api-key: ${API_KEY}"
    ```

    _Expected Response:_ `"Hello Service: AnalyticsService"`

3.  **Service-Only Protected Endpoint (Service via API Key):**

    ```bash
    # Assume you have an API_KEY
    API_KEY="your-generated-api-key"

    curl -X GET http://localhost:3000/protected/service-only \
    -H "x-api-key: ${API_KEY}"
    ```

    _Expected Response:_ `{"message": "This is specific to microservice communication"}`

---

## Features (Detailed)

- **Polymorphic Identity System**: A sophisticated design allowing unified handling of authentication for both human users and internal microservices, providing flexible and context-aware access control.
- **JWT-based User Authentication**: Implements industry-standard JSON Web Tokens for secure user registration and login, ensuring stateless and scalable authenticated sessions.
- **API Key Authentication for Services**: Provides a robust mechanism for microservices to authenticate using revocable and expiring API keys, facilitating secure inter-service communication.
- **Hybrid Authentication Guards**: Configures specific endpoints to accept _either_ a valid JWT (for users) _or_ an authenticated API Key (for services), maximizing flexibility without compromising security.
- **Role-based API Key Creation**: Ensures that only authenticated users with appropriate permissions can generate new API keys for services, maintaining a secure and auditable key management process.
- **Secure Password & Key Storage**: Utilizes `bcrypt` for cryptographic hashing of both user passwords and API key secrets, significantly enhancing protection against data breaches.
- **MongoDB Integration with Mongoose**: Leverages MongoDB as the primary NoSQL database, combined with Mongoose ODM for structured schema definition, validation, and efficient data manipulation.
- **Modular NestJS Architecture**: Adheres to NestJS's modular design principles, organizing the codebase into distinct modules, controllers, services, and authentication strategies for improved maintainability, testability, and scalability.
- **TypeScript-first Development**: Developed entirely in TypeScript, enhancing code quality through static typing, improving developer experience, and reducing runtime errors.

## Technologies Used

| Technology  | Description                                                                                   | Link                                                             |
| :---------- | :-------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| NestJS      | A progressive Node.js framework for building efficient and scalable server-side applications. | [nestjs.com](https://nestjs.com/)                                |
| TypeScript  | A superset of JavaScript that adds optional static typing.                                    | [typescriptlang.org](https://www.typescriptlang.org/)            |
| Mongoose    | MongoDB object data modeling (ODM) for Node.js.                                               | [mongoosejs.com](https://mongoosejs.com/)                        |
| Passport.js | Simple, unobtrusive authentication middleware for Node.js.                                    | [passportjs.org](http://www.passportjs.org/)                     |
| JWT         | A compact, URL-safe means of representing claims.                                             | [jwt.io](https://jwt.io/)                                        |
| Bcrypt      | A library for hashing passwords securely.                                                     | [npmjs.com/package/bcrypt](https://www.npmjs.com/package/bcrypt) |
| MongoDB     | A high-performance, open-source NoSQL document database.                                      | [mongodb.com](https://www.mongodb.com/)                          |
| Node.js     | A JavaScript runtime built on Chrome's V8 JavaScript engine.                                  | [nodejs.org](https://nodejs.org/en)                              |
