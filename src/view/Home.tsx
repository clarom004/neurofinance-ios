import React, { useRef, useState } from 'react';

const HomePage: React.FC = () => {
  const [sum, setSum] = useState(0);
  const refInput = useRef(null);

  const summary = (value: string) => {
    const calculateNumber = value.split('').reduce((sum, value) => {
      return sum + Number(value);
    }, 0);

    setSum(calculateNumber);
  };

  return (
    <div className="container p-4 space-y-6">
      <h1 className="w-full text-xl font-bold">Home</h1>
      <input
        ref={refInput}
        type="number"
        maxLength={10}
        onChange={(e) => summary(e.target.value)}
        className="w-full h-[3rem] border-1 bg-gray-200 rounded-md"
      />
      <div className="w-full text-green-800 text-xl">
        <p>length: {refInput.current.value.length}</p>
        <p>result: {sum}</p>
      </div>
    </div>
  );
};

export default HomePage;
