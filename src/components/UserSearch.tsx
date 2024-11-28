import { useState } from "react";
import useUserSearch from "../hooks/useUserSearch";

const UserSearch = () => {
  const { searchUsers, searchResults, loading, error } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const searchType = searchTerm.includes("@") ? "email" : "username";

    searchUsers(searchTerm, searchType);
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by email or username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching for user..." : "Search"}
        </button>
      </form>

      {error && <div>{error}</div>}
      <ul>
        {searchResults.map((user) => (
          <li key={user.id}>
            {user.displayName} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserSearch;