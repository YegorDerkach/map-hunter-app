import { useState, useCallback } from "react";

// const getCookie = (name: string): string | null => {
//     const cookies = document.cookie.split(';');

//     for (let cookie of cookies) {
//         const [key, value] = cookie.trim().split('=');
//         if (key === name) return value;
//     }

//     return null;
// };

interface HttpReturn<T> {
    request: (url: string, method?: string, body?: any) => Promise<T>;
    clearError: () => void;
    error: string | null;
    loading: boolean;
}

export const useHttp = <T = any>(): HttpReturn<T> => {
    const [loading, setLoading] = useState < boolean > (false);
    const [error, setError] = useState < string | null > (null);

    const request = async (url: string, method: string = "GET", body: any = null): Promise<T> => {
        setLoading(true);

        try {
            const token = '';

            const headers: Record<string, string> = {
                "Content-Type": "application/json"
            };

            if (
                token &&
                !url.includes("/api/auth/login") &&
                !url.includes("/api/auth/register")
            ) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            let actualBody: BodyInit | null = null;
            if (body != null) {
                if (body instanceof File) {
                    const formData = new FormData();
                    formData.append("file", body);
                    actualBody = formData;
                    delete (headers as Record<string, unknown>)["Content-Type"];
                } else if (body instanceof FormData) {
                    actualBody = body;
                    delete (headers as Record<string, unknown>)["Content-Type"];
                } else {
                    actualBody = JSON.stringify(body);
                }
            }

            const response = await fetch(url, {
                method,
                body: actualBody,
                headers
            });

            if (!response.ok) {
                throw new Error(`Could not fetch ${url}, status: ${response.status}`);
            }

            const data: T = await response.json().catch(() => null as T);
            setLoading(false);
            return data;

        } catch (e: any) {
            setLoading(false);
            setError(e.message);
            throw e;
        }
    };

    const clearError = useCallback(() => setError(null), []);

    return { request, clearError, error, loading };
};