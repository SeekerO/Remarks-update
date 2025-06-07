import React from "react";

const SearchBar = ({
    searchText,
    searchSetter,
}: {
    searchText: string;
    searchSetter: React.Dispatch<React.SetStateAction<string>>;
}) => {
    return (

        <input
            type="text"
            value={searchText}
            onChange={(e) => searchSetter(e.target.value)}
            placeholder="Search"
            className="py-1 w-full px-2 text-black outline-none border-none rounded-md"
        />

    );
};

export default SearchBar;
