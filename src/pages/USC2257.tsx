import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

export default function USC2257() {
  useEffect(() => {
    const cleanup = setTitle("USC 2257 Compliance • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  return (
    <main>
      <h1>USC 2257 Record-Keeping Requirements Compliance Statement</h1>
      <p style={{ opacity: 0.8 }}>Last updated: February 3, 2026</p>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Compliant Content</h2>
        <p>
          All models, actors, actresses, and other persons that appear in any
          visual portrayal of actual or simulated sexually explicit conduct
          appearing on, or otherwise contained in, this Website were over the
          age of eighteen (18) years at the time the visual image was produced.
          Records required for all depictions of actual or simulated sexually
          explicit conduct by Title 18 U.S.C. §2257 and 28 C.F.R. §75, et seq.,
          are on file with the appropriate Records Custodian.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Exempt Content</h2>
        <p>
          All other visual depictions displayed on this Website are exempt from
          the provision of Section 2257 because: 1) they do not portray conduct
          as specifically listed in 18 U.S.C §2256 (2)(A) (i) through (iv); 2)
          they do not portray conduct as specifically listed in 18 U.S.C. §2257A
          produced after March 19, 2009; 3) they do not portray conduct listed
          in 18 U.S.C. §2256(2)(A)(v) produced after March 19, 2009; 4) the
          visual depictions were created prior to July 3, 1995; or, 5) this
          Company does not act as a "producer" with respect to the dissemination
          of such exempt images as that term is defined in 28 C.F.R. §75.1(c).
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Title</h2>
        <p>The title of this work is: prcvme</p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Record Inspections</h2>
        <p>
          All records associated with depictions contained herein, required to
          be maintained by federal law, will be made available to authorized
          inspectors by the Records Custodian at the following location:
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          <strong>PRCVME LLC</strong>
          <br />
          Records Custodian
          <br />
          10202 33rd Ave SW Seattle WA 98146
        </p>
        <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
          For inquiries regarding records, please contact{" "}
          <strong>
            <a href="mailto:records@prcvme.com">records@prcvme.com</a>
          </strong>
        </p>
      </section>
    </main>
  );
}
