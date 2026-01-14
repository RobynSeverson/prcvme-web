import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

export default function About() {
  useEffect(() => {
    const cleanup = setTitle("About • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  return (
    <main>
      <h1>About</h1>
      <p>
        prcvme is a lightweight social app for sharing posts and media with a
        simple, private-first feel.
      </p>
    </main>
  );
}
