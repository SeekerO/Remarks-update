// utils/nameMatcher.tsx

function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .replace(/,/g, "")
        .trim()
        .split(/\s+/)
        .sort()
        .join(" ");
}

function nameSimilarity(name1: string, name2: string): number {
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);

    let matches = 0;
    const len = Math.max(n1.length, n2.length);

    for (let i = 0; i < Math.min(n1.length, n2.length); i++) {
        if (n1[i] === n2[i]) matches++;
    }

    return (matches / len) * 100;
}

export interface CompareResult {
    name1: string;
    name2: string;
    similarity: number;
}

export interface JsonData {
    names?: string[];
}

export function compareJsonNames(
    json1: JsonData,
    json2: JsonData,
    threshold: number = 70
): CompareResult[] {
    const list1 = json1.names || [];
    const list2 = json2.names || [];

    const results: CompareResult[] = [];

    list1.forEach((n1) => {
        list2.forEach((n2) => {
            const similarity = nameSimilarity(n1, n2);
            if (similarity >= threshold) {
                results.push({
                    name1: n1,
                    name2: n2,
                    similarity: parseFloat(similarity.toFixed(2)),
                });
            }
        });
    });

    return results;
}
