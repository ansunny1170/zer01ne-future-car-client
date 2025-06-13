import CategorySelector from "../category-selector";

export default function Step2({ category, setCategory }: { category: string, setCategory: (category: string) => void }) {
  return (
    <div>
      <div className="pl-8">
        <CategorySelector setCategory={setCategory} />
      </div>
    </div>
  );
}