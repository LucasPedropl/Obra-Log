/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppRouter } from './routes/AppRouter';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}
