import { useQuery } from "@tanstack/react-query";

export interface Country {
  name: string;
  code: string;
  flagUrl: string;
}

export function useCountries() {
  return useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: async () => {
      const res = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,cca2,flags"
      );
      if (!res.ok) throw new Error("Failed to fetch countries");
      const data = await res.json();
      return data
        .map((c: any) => ({
          name: c.name.common,
          code: c.cca2,
          flagUrl: c.flags.svg,
        }))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
    },
    staleTime: 1000 * 60 * 60 * 24,
  });
}
