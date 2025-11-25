export default function Filters({
  search,
  setSearch,
  category,
  setCategory,
  status,
  setStatus,
  sort,
  setSort,
  showSearch = true,
}) {
  return (
    <div className="bg-white shadow p-6 rounded-xl max-w-5xl mx-auto mt-6">
      {showSearch && (
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full border p-3 rounded-lg mb-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      <div className="grid grid-cols-3 gap-4">
        <select
          className="border p-3 rounded-lg"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All Categories</option>
          <option>Electronics</option>
          <option>Personal</option>
        </select>

        <select
          className="border p-3 rounded-lg"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>All Status</option>
          <option>Lost</option>
          <option>Found</option>
          <option>Returned</option>
        </select>

        <select
          className="border p-3 rounded-lg"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>Date Reported</option>
          <option>Name</option>
        </select>
      </div>
    </div>
  );
}
