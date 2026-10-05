import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { useState } from "react";
import { GreetService } from "./gen/greet/v1/greet_pb.js";

const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
});

const client = createClient(GreetService, transport);

export function App() {
  const [name, setName] = useState("World");
  const [output, setOutput] = useState("");

  const sayHello = async () => {
    setOutput("Calling SayHello...");
    try {
      const res = await client.sayHello({ name });
      setOutput(res.greeting);
    } catch (err) {
      setOutput(`Error: ${String(err)}`);
    }
  };

  const sayHelloStream = async () => {
    setOutput("");
    try {
      for await (const res of client.sayHelloStream({ name })) {
        setOutput((prev) => `${prev}${res.greeting} `);
      }
    } catch (err) {
      setOutput((prev) => `${prev}\nError: ${String(err)}`);
    }
  };

  return (
    <main>
      <h1>gRPC Practice</h1>
      <p>
        This page calls the backend's <code>GreetService</code> using Connect-Web.
      </p>

      <label htmlFor="name">Name</label>
      <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="buttons">
        <button onClick={sayHello}>Say Hello (unary)</button>
        <button onClick={sayHelloStream}>Say Hello (streaming)</button>
      </div>

      <pre>{output}</pre>
    </main>
  );
}
