import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import api from "@/lib/api";

const useApi = () => {
  const { data: session } = useSession();

  useEffect(() => {
    const requestIntercept = api.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"] && session?.accessToken) {
          config.headers["Authorization"] = `Bearer ${session.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await signOut({ callbackUrl: "/login" });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestIntercept);
      api.interceptors.response.eject(responseIntercept);
    };
  }, [session]);

  return api;
};

export default useApi;
