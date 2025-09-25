import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <h1>Hello World {count}</h1>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-blue-500 text-white p-2 rounded-md"
        >
          Increment
        </button>
      </div>
    </>
  );
}

export default App;
