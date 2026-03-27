import { createContext } from 'react';
import { useMobileConstraints } from './useMobileConstraints';

export const MobileConstraintsContext = createContext<ReturnType<typeof useMobileConstraints> | null>(null);