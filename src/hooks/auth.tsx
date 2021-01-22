import React, { createContext, useCallback, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import AsyncStorage from '@react-native-community/async-storage'


interface SignInCredentials {
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
}

interface AuthContextState {
  user: User;
  signIn(credations: SignInCredentials): Promise<void>;
  signOut(): void;
  loading: boolean;
  updateUser(user: User): Promise<void>;
}

interface AuthState {
  token: string;
  user: User;
}

export const AuthContext = createContext<AuthContextState>({} as AuthContextState);

export const AuthProvider: React.FC = ({ children }) => {

  const [ data, setData] = useState<AuthState>({} as AuthState)
  const [ loading, setLoading ] = useState(true);


  useEffect(() => {
    async function loadStorageledData(): Promise<void>  {
      const [ token, user ] = await AsyncStorage.multiGet([
        '@GoBarber:token',
        '@GoBarber:user'
      ]);

      if (token[1] && user[1]){
        api.defaults.headers.authorization = `Bearer ${token[1]}`
        setData({ token: token[1], user: JSON.parse(user[1]) });
      }

      setLoading(false)
    }

    loadStorageledData();

  }, [])

  const signIn = useCallback(async ({email, password}) => {
    const response = await api.post('sessions', {
      email,
      password
    });

    console.log(email)

    const { token, user } = response.data;

    await AsyncStorage.multiSet([
      ['@GoBarber:token', token],
      ['@GoBarber:user', JSON.stringify(user)]
    ])

    api.defaults.headers.authorization = `Bearer ${token}`

    setData({ token, user });
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@GoBarber:token', '@GoBarber:user']);

    setData({} as AuthState)
  }, []);

  const updateUser = useCallback(async (user: User) => {
    await AsyncStorage.setItem('@GoBarber:user', JSON.stringify(user));

    setData({
      token: data.token,
      user,
    })

  }, [setData, data.token])

  return (
    <AuthContext.Provider value={{ user: data.user, signIn, signOut, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
};


export function useAuth(): AuthContextState {

  const context = useContext(AuthContext);

  if(!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context
}
