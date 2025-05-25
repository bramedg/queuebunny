# 🐇 QueueBunny

![image](./logo.png)

*QueueBunny* is a lightweight RPC connector from RabbitMQ to your command line applications.

---

## ✨ Features

- Easy mapping AMQP of messages to shell commands
- Returning response in a simple JSON format
- Works well with Cottontail!
- No need to adapt existing tools to RabbitMQ

---

## 📦 Project Structure

```
src                  # Source Code
config.yml           # Route configuration
package.json         # Project dependencies and scripts
tsconfig.json        # TypeScript config
README.md            # You're here!
```

---


## 🚀 Getting Started

### 1. Install from NPM

```bash
npm install -g @bramedg/queuebunny
```

### 2. Set environment variables

```
export AMQP_URL="amqp://guest:guest@localhost"
```

### 5. Start QueueBunny

```
queuebunny echo.test "echo {{body.valueToEcho}}"
```

### 6. Create a tap queue for the response

Bind to exchange: amq.topic
Bind to routing key: response.key

---

## 📡 Example Request

```
reply_to: response.key
exchange: amq.topic

Message Body:
{
  "valueToEcho": "Hello World"
}
```
Assuming everything is set up properly, you'll get a response to your tap queue:

```json
  { 
    "status": "success",
    "output": "Hello World" 
  }
```

## 📜 License

MIT © 2025 Daniel Brame

---



