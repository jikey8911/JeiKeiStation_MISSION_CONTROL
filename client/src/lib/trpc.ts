import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";
import superjson from "superjson";
import { toast } from "sonner";
import {
  QueryClient,
  QueryCache,
  MutationCache,
  DefaultError,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";

export const trpc = createTRPCReact<AppRouter>();

/**
 * Formatea mensajes de error de tRPC de forma amigable para el usuario.
 * Oculta detalles técnicos y stacktraces.
 */
function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    // Errores de red
    if (message.includes("fetch") || message.includes("network")) {
      return "No se pudo conectar al servidor. Verifica tu conexión a internet.";
    }

    // Errores de validación (BAD_REQUEST)
    if (message.includes("BAD_REQUEST") || message.includes("validation")) {
      return "Los datos enviados no son válidos. Por favor, revisa tu entrada.";
    }

    // Errores de autenticación
    if (message.includes("UNAUTHORIZED") || message.includes("401")) {
      return "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.";
    }

    // Errores de permisos
    if (message.includes("FORBIDDEN") || message.includes("403")) {
      return "No tienes permisos para realizar esta acción.";
    }

    // Errores de no encontrado
    if (message.includes("NOT_FOUND") || message.includes("404")) {
      return "El recurso solicitado no fue encontrado.";
    }

    // Errores de conflicto
    if (message.includes("CONFLICT") || message.includes("409")) {
      return "Existe un conflicto con los datos. Intenta de nuevo.";
    }

    // Errores de servidor
    if (message.includes("INTERNAL_SERVER_ERROR") || message.includes("500")) {
      return "Ocurrió un error en el servidor. Por favor, intenta de nuevo más tarde.";
    }

    // Timeout
    if (message.includes("timeout") || message.includes("TIMEOUT")) {
      return "La solicitud tardó demasiado. Por favor, intenta de nuevo.";
    }

    // Si el mensaje es corto y parece ser un error personalizado, úsalo directamente
    if (message.length < 100 && !message.includes("Error")) {
      return message;
    }

    // Fallback: mensaje genérico
    return "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
}

/**
 * Configuración global de errores para TanStack Query.
 * Intercepta todos los errores de queries y mutations.
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antes era cacheTime)
    },
    mutations: {
      retry: 0, // No reintentar mutaciones automáticamente
    },
  },
};

const getEndingLink = () => {
  if (typeof window === "undefined") {
    return httpBatchLink({
      url: `/api/trpc`,
      transformer: superjson,
    });
  }

  // En local desactivamos WS para evitar errores de handshake/auth en dashboard informativo.
  return httpBatchLink({
    url: `http://localhost:3000/api/trpc`,
    transformer: superjson,
    fetch(input, init) {
      return globalThis.fetch(input, {
        ...(init ?? {}),
        credentials: "include",
      });
    },
  });
};

export const trpcClient = trpc.createClient({
  links: [getEndingLink()],
});

/**
 * Crea una instancia de QueryClient con configuración global de errores.
 * Esto intercepta todos los errores de queries y mutations a nivel global.
 */
export function createQueryClient() {
  return new QueryClient({
    ...queryClientConfig,
    queryCache: new QueryCache({
      onError: (error) => {
        const formattedMessage = formatErrorMessage(error);
        toast.error(formattedMessage, {
          duration: 4000,
          description:
            "Intenta de nuevo o contacta al soporte si el problema persiste.",
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        const formattedMessage = formatErrorMessage(error);
        toast.error(formattedMessage, {
          duration: 4000,
          description:
            "Intenta de nuevo o contacta al soporte si el problema persiste.",
        });
      },
    }),
  });
}

/**
 * Hook personalizado para queries con manejo de errores mejorado.
 * Permite sobrescribir el comportamiento de error a nivel de componente si es necesario.
 */
export function useQueryWithErrorHandling<
  TData = unknown,
  TError = DefaultError
>(
  options?: Omit<UseQueryOptions<TData, TError>, "onError"> & {
    onError?: (error: TError) => void;
    showErrorToast?: boolean;
  }
) {
  const { onError, showErrorToast = true, ...rest } = options || {};

  return {
    ...rest,
    onError: (error: TError) => {
      if (showErrorToast) {
        const formattedMessage = formatErrorMessage(error);
        toast.error(formattedMessage);
      }
      onError?.(error);
    },
  };
}

/**
 * Hook personalizado para mutations con manejo de errores mejorado.
 * Permite sobrescribir el comportamiento de error a nivel de componente si es necesario.
 */
export function useMutationWithErrorHandling<
  TData = unknown,
  TError = DefaultError,
  TVariables = void
>(
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, "onError"> & {
    onError?: (error: TError) => void;
    showErrorToast?: boolean;
  }
) {
  const { onError, showErrorToast = true, ...rest } = options || {};

  return {
    ...rest,
    onError: (error: TError) => {
      if (showErrorToast) {
        const formattedMessage = formatErrorMessage(error);
        toast.error(formattedMessage);
      }
      onError?.(error);
    },
  };
}
