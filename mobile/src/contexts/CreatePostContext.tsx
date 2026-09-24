import { createContext, ReactNode, useContext } from "react";

type CreatePostContextType = {
  openCreatePost: () => void;
};

const CreatePostContext = createContext<CreatePostContextType | undefined>(
  undefined,
);

type Props = {
  children: ReactNode;
  openCreatePost: () => void;
};

export function CreatePostProvider({ children, openCreatePost }: Props) {
  return (
    <CreatePostContext.Provider value={{ openCreatePost }}>
      {children}
    </CreatePostContext.Provider>
  );
}

export function useCreatePost() {
  const context = useContext(CreatePostContext);

  if (!context) {
    throw new Error("useCreatePost phải được dùng trong CreatePostProvider.");
  }

  return context;
}
