import React, { useEffect, useState } from 'react';
import ProtectedDashboard from '../components/ProtectedDashboard';
import { getInvoices, getPaymentMethods } from '../utils/hostingApi';

interface Invoice {
    id: number;
    invoiceNumber: string;
    date: string;
    description: string;
    amount: string;
    status: string;
    paymentMethod?: string;
    paidAt?: string;
}

interface PaymentMethod {
    id: number;
    type: string;
    last4: string;
    expiry: string;
    isDefault: boolean;
}

const BillingPage: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [invoicesRes, paymentsRes] = await Promise.all([
                getInvoices(),
                getPaymentMethods()
            ]);

            if (invoicesRes.success) setInvoices(invoicesRes.data);
            if (paymentsRes.success) setPaymentMethods(paymentsRes.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch billing data');
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedDashboard>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading billing information...</p>
                    </div>
                </div>
            </ProtectedDashboard>
        );
    }

    if (error) {
        return (
            <ProtectedDashboard>
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </ProtectedDashboard>
        );
    }

    const totalSpent = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((acc, inv) => acc + parseFloat(inv.amount.replace('$', '')), 0);

    return (
        <ProtectedDashboard>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
                        <p className="text-gray-600 mt-1">Manage your subscription and payment methods</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                                <p className="text-2xl font-bold text-gray-900">Premium</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Next Billing</p>
                                <p className="text-2xl font-bold text-gray-900">Feb 15</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                                <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Credits</p>
                                <p className="text-2xl font-bold text-gray-900">$0.00</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Plan */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Premium Hosting Plan</h2>
                            <p className="text-blue-100 mb-4">Everything you need to run your business</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">$29.99</span>
                                <span className="text-blue-100">/month</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all">
                                Upgrade Plan
                            </button>
                            <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all">
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                </div>

                {/* Invoice History */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900">Invoice History</h2>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
                            <p className="text-gray-600">Your invoice history will appear here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{invoice.date}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{invoice.description}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{invoice.amount}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                        invoice.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="px-3 py-1.5 text-xs font-medium text-[#5865F2] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 ml-auto">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Download PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Payment Methods</h2>
                        <button className="px-4 py-2 bg-[#5865F2] text-white rounded-lg text-sm font-semibold hover:bg-[#4F46E5] transition-colors">
                            Add Payment Method
                        </button>
                    </div>

                    {paymentMethods.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600">No payment methods added</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {paymentMethods.map((pm) => (
                                <div key={pm.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                                                {pm.type.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">•••• {pm.last4}</div>
                                                <div className="text-xs text-gray-500">Expires {pm.expiry}</div>
                                            </div>
                                        </div>
                                        {pm.isDefault && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">Default</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {!pm.isDefault && (
                                            <button className="text-xs text-[#5865F2] hover:underline">Set as Default</button>
                                        )}
                                        <button className="text-xs text-red-600 hover:underline ml-auto">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedDashboard>
    );
};

export default BillingPage;
