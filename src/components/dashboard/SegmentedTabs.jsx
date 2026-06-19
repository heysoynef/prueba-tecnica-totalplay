function SegmentedTabs({ activeTab, onChange }) {
  return (
    <div className="mx-auto grid h-12 w-full max-w-[520px] grid-cols-2 rounded-lg bg-[#f1f1f3] p-1">
      <button className={`rounded-lg text-base font-semibold transition ${activeTab === "books" ? "bg-white text-black shadow-sm" : "text-[#73737d] hover:text-black"}`} type="button" onClick={() => onChange("books")}>Libros</button>
      <button className={`rounded-lg text-base font-semibold transition ${activeTab === "authors" ? "bg-white text-black shadow-sm" : "text-[#73737d] hover:text-black"}`} type="button" onClick={() => onChange("authors")}>Autores</button>
    </div>
  );
}

export default SegmentedTabs;
