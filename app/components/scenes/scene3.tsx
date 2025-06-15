import SelectButtons from "../buttons/question-buttons";

export default function Scene3({ setCategory }: { setCategory: (category: string) => void }) {
  return (
    <div>
      <div className="pl-8">
        <SelectButtons sceneNumber={3} setCategory={setCategory} />
      </div>
    </div>
  );
}