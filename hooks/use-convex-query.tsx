import { useMutation, useQuery } from "convex/react"
import { FunctionReference } from "convex/server";
import { useEffect, useState } from "react";
import { toast } from "sonner";



export function useConvexQuery<T>(
    query: FunctionReference<"query">,
    args: any
): {
    data: T | undefined;
    isLoading: boolean;
    error: Error | null;
} {
    const result = useQuery(query, args);

    const [data, setData] = useState<T | undefined>(undefined);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (result === undefined) {
            setIsLoading(true);
            return;
        }

        setData(result as T);
        setError(null);
        setIsLoading(false);
    }, [result]);

    return { data, isLoading, error };
}



export const useConvexMutation = (mutation: FunctionReference<"mutation">) => {
    const mutateFn = useMutation(mutation);

    const [data, setData] = useState(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const mutate = async (args: any) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await mutateFn(args);
            console.log("result of mutation in hook: ", result);
            setData(result);
            return result;

        } catch (error: any) {
            console.log("Error occured in use convex mutation: ", error);
            toast.error(error.message);
            return;
        }
        finally {
            setIsLoading(false);
        }
    }
    return { data, mutate, error, isLoading };
}