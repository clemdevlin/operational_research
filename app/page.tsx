import Workbench from "../components/lp-workbench";
export default function HomePage() {
  return (
    <>
      <div className="intro">
        <p className="eyebrow">TOPIC 01 · GRAPHICAL METHOD</p>
        <h1>Linear Programming</h1>
        <p>
          Turn constraints into a picture. Find the best feasible solution, then
          move a slider to see what changes.
        </p>
      </div>
      <Workbench />
    </>
  );
}
