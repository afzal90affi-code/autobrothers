"use client";

import { createContext, useContext, useEffect, useState } from "react";

type MyCar = {
  make: string;
  model: string;
};

type CarContextType = {
  myCar: MyCar | null;
  setMyCar: (car: MyCar | null) => void;
  clearCar: () => void;
};

const CarContext = createContext<CarContextType>({
  myCar: null,
  setMyCar: () => {},
  clearCar: () => {},
});

export function CarProvider({ children }: { children: React.ReactNode }) {
  const [myCar, setMyCarState] = useState<MyCar | null>(null);

  /* LocalStorage se load — user ki subscribed gari yaad rehti hai */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ab_my_car");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.make && parsed?.model) setMyCarState(parsed);
      }
    } catch {}
  }, []);

  const setMyCar = (car: MyCar | null) => {
    setMyCarState(car);
    try {
      if (car) localStorage.setItem("ab_my_car", JSON.stringify(car));
      else localStorage.removeItem("ab_my_car");
      /* Sab components ko refresh signal */
      window.dispatchEvent(new Event("ab_car_changed"));
    } catch {}
  };

  const clearCar = () => setMyCar(null);

  return (
    <CarContext.Provider value={{ myCar, setMyCar, clearCar }}>
      {children}
    </CarContext.Provider>
  );
}

export const useMyCar = () => useContext(CarContext);
