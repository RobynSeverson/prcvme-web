import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

export default function Contact() {
  useEffect(() => {
    const cleanup = setTitle("Contact • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  return (
    <main>
      <h1>Contact</h1>
      <p>
        email: <a href="mailto:contact@prcvme.com">contact@prcvme.com</a>
      </p>

      <p>phone: +1 206-351-8271</p>

      <p>address: 10202 33rd Ave SW, Seattle, WA 98146</p>
    </main>
  );
}
