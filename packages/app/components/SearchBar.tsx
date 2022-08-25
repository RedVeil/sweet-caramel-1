import * as Icon from "react-feather";

interface SearchBarProps {
  searchValue: string;
  setSearchValue: (userInput: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchValue, setSearchValue }) => {
  return (
    <div className="h-16 relative rounded-4xl shadow-md border-gray-200 border flex flex-row justtify-start items-center w-full">
      <Icon.Search className="left-6 absolute" />
      <input
        className="w-full h-full pl-16 pr-4 py-2 font-medium placeholder-gray-400 text-gray-400 text-lg shadow-sm rounded-4xl"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Type to search"
      />
    </div>
  );
};

export default SearchBar;
