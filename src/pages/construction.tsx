import { useSetupConnection } from "@/hooks/useSetupConnection";
import { useLoadIntialValues } from "@/hooks/useLoadIntialValues";

export default function About() {
  useSetupConnection();
  useLoadIntialValues();

  return (
    <div>
      <section className="daily-horp d-inline-block w-100">
        <br />
        <br />
        <br />
        <br />
        <br />

        <div className="container-construction">
          <h1>This page is under construction</h1>
          <p>We&#39;ll be here soon with our new awesome site.</p>
        </div>
        {""}
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
      </section>
    </div>
  );
}
