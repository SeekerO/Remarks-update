"use client";

import { useState } from "react";

/**
 * An array representing a single row from an Excel sheet.
 * Can contain a mix of strings, numbers, and booleans.
 */
type ExcelRow = (string | number | boolean)[];

/**
 * The structure for a matched result, matching the API's response.
 */
interface MatchedResult {
    row1: ExcelRow;
    bestMatch: ExcelRow;
    score: number;
}

/**
 * The structure for the overall comparison results from the API.
 */
interface ComparisonResults {
    matched: MatchedResult[];
    unmatched: ExcelRow[];
}

export default function MatcherPage() {
    // Define state with explicit types using generics.
    const [file1, setFile1] = useState<File | null>(null);
    const [file2, setFile2] = useState<File | null>(null);
    const [threshold, setThreshold] = useState<number>(85);
    const [results, setResults] = useState<ComparisonResults | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResults(null);

        if (!file1 || !file2) {
            setError("Please select both files.");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("file1", file1);
        formData.append("file2", file2);
        formData.append("threshold", threshold.toString());

        try {
            const response = await fetch("/api/compare-files", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Something went wrong on the server.");
            }

            const data: ComparisonResults = await response.json();
            setResults(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Excel Fuzzy Matcher</h1>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                    <label>
                        File 1:
                        <input type="file" onChange={(e) => setFile1(e.target.files?.[0] || null)} />
                    </label>
                </div>
                <div>
                    <label>
                        File 2:
                        <input type="file" onChange={(e) => setFile2(e.target.files?.[0] || null)} />
                    </label>
                </div>
                <div>
                    <label>
                        Match Threshold (%):
                        <input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(parseFloat(e.target.value))}
                            min="0"
                            max="100"
                        />
                    </label>
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Matching..." : "Compare Files"}
                </button>
            </form>

            {error && <p style={{ color: "red" }}>{error}</p>}
            {results && (
                <div style={{ marginTop: "2rem" }}>
                    <h2>Results</h2>
                    <h3>Matched Names ({results.matched.length})</h3>
                    <ul>
                        {results.matched.map((match, index) => (
                            <li key={index}>
                                <strong>{match.row1[0]}</strong> matched with <strong>{match.bestMatch[0]}</strong> (Score: {match.score.toFixed(1)}%)
                            </li>
                        ))}
                    </ul>

                    <h3>Unmatched Names ({results.unmatched.length})</h3>
                    <ul>
                        {results.unmatched.map((row, index) => (
                            <li key={index}>{row[0]}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
