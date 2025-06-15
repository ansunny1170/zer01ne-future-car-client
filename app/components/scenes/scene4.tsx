import SelectButtons from "../buttons/question-buttons";

export default function Scene4({ setCategory }: { setCategory: (category: string) => void }) {
  return (
    <div>
      <div className="pl-8">
        <SelectButtons sceneNumber={4} setCategory={setCategory} />
      </div>
    </div>
  );
}