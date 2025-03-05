import { parseAsString, useQueryStates } from "nuqs";

const useEventFilter = () => {
  return useQueryStates({
    date: parseAsString,
    keyword: parseAsString,
    attendees: parseAsString,
  });
};

export default useEventFilter;
