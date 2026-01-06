# FastAPI Concepts & Interview Preparation

This document outlines the core FastAPI and backend concepts implemented in the **LuminAI Data Analyst** project, along with curated interview questions to help you prepare for technical discussions.

## 🚀 Core Concepts Covered in Project

| Concept | Implementation in Project |
| :--- | :--- |
| **Routes (GET, POST, PUT, DELETE)** | Found in `backend/app/api/routes/task_router.py`. |
| **Path & Query Parameters** | Used for specific resource fetching (e.g., `/update-task/{task_id}`). |
| **Pydantic Validation** | Schemas defined in `backend/app/api/validators/task_validator.py`. |
| **Asynchronous Logic** | All endpoints use `async def` for non-blocking performance. |
| **Dependency Injection** | Used for database sessions (`Depends(get_db)`) and authentication. |
| **Middleware** | `AuthMiddleware` in `main.py` intercepts requests for security. |
| **Database Integration** | SQLAlchemy with PostgreSQL/SQLite via a modular DB layer. |
| **Scalable Architecture** | Decoupled structure (Routes -> Controllers -> Models). |
| **Containerization** | Multi-container setup using `Docker` and `Docker Compose`. |
| **Interactive Docs** | Swagger UI (`/docs`) and Redoc (`/redoc`) available out-of-the-box. |

---

## 💡 FastAPI Interview Questions

### 🔵 Basic Questions
1. **What is FastAPI and what makes it different from Flask/Django?**
   * *Answer:* FastAPI is a modern, high-performance web framework for building APIs with Python 3.6+. It is based on standard Python type hints. Key differences: faster (comparable to Node.js/Go), uses Pydantic for validation, and has built-in async support.

2. **What is Uvicorn?**
   * *Answer:* Uvicorn is an ASGI (Asynchronous Server Gateway Interface) server implementation. It is used to serve FastAPI applications because FastAPI itself is an ASGI framework.

3. **How does FastAPI handle data validation?**
   * *Answer:* It uses **Pydantic** models. When you define a schema, FastAPI automatically validates the request body, query params, and path params against that model and returns a 422 error if it fails.

### 🟡 Intermediate Questions
4. **Explain Dependency Injection in FastAPI.**
   * *Answer:* It’s a way to declare requirements for your path operation functions (like DB sessions or security). Using `Depends()`, FastAPI takes care of creating and passing the required object to your function, promoting code reuse and testability.

5. **What is the difference between `async def` and `def` in FastAPI?**
   * *Answer:* `async def` is for non-blocking operations (I/O bound). If you use `def`, FastAPI runs it in a separate thread pool to avoid blocking the main event loop. For DB calls and API requests, `async def` is preferred.

6. **How do you handle custom exceptions in FastAPI?**
   * *Answer:* You use the `@app.exception_handler` decorator. You can create a custom exception class and define a handler that returns a specific JSON response and status code.

### 🔴 Advanced Questions
7. **What is Middleware and when would you use it?**
   * *Answer:* Middleware is logic that runs before every request or after every response. Common use cases include authentication, CORS handling, GZip compression, and logging.

8. **How does FastAPI generate documentation automatically?**
   * *Answer:* It uses the **OpenAPI** standard. Because FastAPI uses Python type hints and Pydantic models, it can inspect your code and generate a JSON schema, which Swagger UI then renders visually.

9. **Explain how SQLAlchemy integrates with FastAPI.**
   * *Answer:* You typically create a `SessionLocal` class and use a dependency (`get_db`) that creates a session, yields it to the route handler, and closes it once the request is finished (using `try...finally`).

---

## 🛠️ Deployment Checklist
- [x] **Environment Variables**: Managed via `.env` files.
- [x] **Dockerization**: `Dockerfile.backend` and `docker-compose.yml` configured.
- [x] **Production Server**: Using Uvicorn with auto-reload disabled.
- [x] **CORS Configuration**: Handled in `main.py` to allow frontend communication.
