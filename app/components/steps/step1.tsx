import CategorySelector from "../category-selector";

export default function Step1({ category, setCategory }: { category: string, setCategory: (category: string) => void }) {
  return (
    <div>
      <div className="pl-8">
        <div className="pb-4">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Center Page</h1>
            <p className="text-gray-600">{category}</p>
        </div>

        <CategorySelector setCategory={setCategory} />
      </div>
    </div>
  );
}