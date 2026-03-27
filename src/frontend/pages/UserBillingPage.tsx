import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
 Container,
 Box,
 Card,
 CardContent,
 Typography,
 Table,
 TableBody,
 TableCell,
 TableContainer,
 TableHead,
 TableRow,
 Chip,
 Alert,
 Button,
 TextField,
 Dialog,
 DialogTitle,
 DialogContent,
 DialogActions,
 CircularProgress,
 Tab,
 Tabs,
 Stack,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useErrorHandler } from '../utils/errorHandler';
import axios from 'axios';
import type { Invoice } from '../../types.js';
import { formatCurrency } from '../utils/currency';

interface BillingInfo {
 balance: number;
 invoices: Invoice[];
}

interface PaymentOrder {
 id: string;
 outTradeNo: string;
 tradeNo?: string;
 money: number;
 type: string;
 status: 'pending' | 'paid' | 'failed' | 'expired' | 'closed';
 moduleName: string;
 remark?: string;
 createdAt: number;
 paidAt?: number;
}

interface PaymentOrdersResponse {
 orders: PaymentOrder[];
 total: number;
}

export function UserBillingPage() {
 const navigate = useNavigate();
 const { user, token } = useAuth();
 const { t } = useTranslation();
 const { handleError } = useErrorHandler();
 const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
 const [redeemCode, setRedeemCode] = useState('');
 const [redeemLoading, setRedeemLoading] = useState(false);
 const [redeemError, setRedeemError] = useState('');
 const [redeemSuccess, setRedeemSuccess] = useState('');
 const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
 const [chargeAmount, setChargeAmount] = useState('');
 const [chargeType, setChargeType] = useState('alipay');
 const [chargeLoading, setChargeLoading] = useState(false);

 const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
   const [ordersLoading, setOrdersLoading] = useState(false);
   const [activeTab, setActiveTab] = useState(0);
   const [systemSettings, setSystemSettings] = useState<{ supportEmail?: string }>({});
 
   useEffect(() => {
  if (!user || !token) {
  navigate('/login');
  return;
  }
 
  fetchBillingInfo();
  fetchPaymentOrders();
  fetchSettings();
  }, [user, token, navigate]);
 
   const fetchSettings = async () => {
     try {
       const response = await axios.get('/api/settings', {
         headers: { Authorization: `Bearer ${token}` },
       });
       setSystemSettings({
         supportEmail: response.data.supportEmail || 'support@example.com',
       });
     } catch (err: any) {
       console.error('Failed to load settings:', handleError(err, false));
     }
   };
 const fetchBillingInfo = async () => {
 try {
 const response = await axios.get('/api/user/billing', {
 headers: { Authorization: `Bearer ${token}` },
 });
 setBillingInfo(response.data);
 } catch (err: any) {
 const errorMessage = handleError(err, false);
 setError(errorMessage);
 } finally {
 setLoading(false);
 }
 };

 const fetchPaymentOrders = async () => {
 setOrdersLoading(true);
 try {
 const response = await axios.get<PaymentOrdersResponse>('/api/payment/orders', {
 headers: { Authorization: `Bearer ${token}` },
 });
 setPaymentOrders(response.data.orders);
 } catch (err: any) {
 console.error('Failed to load payment orders:', handleError(err, false));
 } finally {
 setOrdersLoading(false);
 }
 };

 const handleRedeemCode = async () => {
 if (!redeemCode.trim()) {
 setRedeemError(t('billing.redeem.validation.requiredCode', 'Please enter a redemption code'));
 return;
 }

 setRedeemLoading(true);
 setRedeemError('');
 setRedeemSuccess('');

 try {
 const response = await axios.post(
 '/api/payment/redeem',
 { code: redeemCode },
 { headers: { Authorization: `Bearer ${token}` } }
 );

 setRedeemSuccess(
 t('billing.redeem.successAdded', 'Successfully redeemed! Added {{amount}}', {
 amount: formatCurrency(response.data.amount),
 })
 );
 setRedeemCode('');
 fetchBillingInfo();
 setTimeout(() => setRedeemDialogOpen(false),1500);
 } catch (err: any) {
 const errorMessage = handleError(err, false);
 setRedeemError(errorMessage);
 } finally {
 setRedeemLoading(false);
 }
 };

 const handleCharge = async () => {
 if (!chargeAmount || parseFloat(chargeAmount) <=0) {
 return;
 }

 setChargeLoading(true);

 try {
 const response = await axios.post(
 '/api/payment/create',
 {
 type: chargeType,
 name: t('billing.charge.orderName', 'Charge {{amount}}', { amount: chargeAmount }),
 money: parseFloat(chargeAmount),
 },
 { headers: { Authorization: `Bearer ${token}` } }
 );

 if (response.data.payUrl) {
 window.location.href = response.data.payUrl;
 } else if (response.data.qrCode) {
 alert(t('billing.charge.scanQrCode', 'Please scan the QR code to complete payment'));
 }
 } catch (err: any) {
 const errorMessage = handleError(err, false);
 alert(errorMessage);
 } finally {
 setChargeLoading(false);
 }
 };

 const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
 switch (status) {
 case 'paid':
 return 'success';
 case 'pending':
 return 'warning';
 case 'failed':
 case 'expired':
 case 'closed':
 case 'overdue':
 return 'error';
 default:
 return 'default';
 }
 };

 const getStatusLabel = (status: string): string => {
 switch (status) {
 case 'paid':
 return t('billing.statuses.paid', 'Paid');
 case 'pending':
 return t('billing.statuses.pending', 'Pending');
 case 'failed':
 return t('billing.statuses.failed', 'Failed');
 case 'expired':
 return t('billing.statuses.expired', 'Expired');
 case 'closed':
 return t('billing.statuses.closed', 'Closed');
 case 'overdue':
 return t('billing.statuses.overdue', 'Overdue');
 default:
 return status;
 }
 };

 const getPaymentTypeLabel = (type: string): string => {
 switch (type) {
 case 'alipay':
 return t('billing.paymentTypes.alipay', 'Alipay');
 case 'wxpay':
 return t('billing.paymentTypes.wxpay', 'WeChat Pay');
 default:
 return type.toUpperCase();
 }
 };

 if (loading) {
 return <LoadingSpinner />;
 }

 return (
 <Container maxWidth="lg" sx={{ py:4 }}>
 <Box sx={{ mb:4 }}>
 <Typography variant="h4" sx={{ fontWeight:600, mb:1 }}>
 {t('billing.title')}
 </Typography>
 <Typography variant="body2" sx={{ color: 'text.secondary' }}>
 {t('billing.description')}
 </Typography>
 </Box>

 {error && (
 <Alert severity="error" sx={{ mb:3 }}>
 {error}
 </Alert>
 )}

 <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr1fr', md: '1fr1fr1fr' }, gap:3, mb:4 }}>
 <Card>
 <CardContent>
 <Typography color="textSecondary" gutterBottom>
 {t('billing.currentBalance')}
 </Typography>
 <Typography variant="h4" sx={{ fontWeight:600, color: 'primary.main' }}>
 {formatCurrency(billingInfo?.balance ||0,2)}
 </Typography>
 <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt:1 }}>
 {t('billing.availableForUsage')}
 </Typography>
 </CardContent>
 </Card>
 </Box>

 <Box sx={{ display: 'flex', gap:2, mb:4 }}>
 <Button variant="contained" color="primary" onClick={() => setChargeDialogOpen(true)}>
 {t('billing.charge.button', 'Charge Balance')}
 </Button>
 <Button variant="outlined" color="primary" onClick={() => setRedeemDialogOpen(true)}>
 {t('billing.redeem.button', 'Redeem Code')}
 </Button>
 </Box>

 <Box sx={{ borderBottom:1, borderColor: 'divider', mb:3 }}>
 <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
 <Tab label={t('billing.paymentOrders', 'Payment Orders')} />
 <Tab label={t('billing.invoices')} />
 </Tabs>
 </Box>

 {activeTab ===0 && (
 <Card>
 <CardContent>
 <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>
 {t('billing.paymentOrders', 'Payment Orders')}
 </Typography>
 {ordersLoading ? (
 <Box sx={{ display: 'flex', justifyContent: 'center', py:4 }}>
 <CircularProgress />
 </Box>
 ) : paymentOrders.length >0 ? (
 <TableContainer>
 <Table>
 <TableHead>
 <TableRow sx={{ backgroundColor: 'action.hover' }}>
 <TableCell>{t('billing.orders.orderNo', 'Order No.')}</TableCell>
 <TableCell>{t('billing.orders.type', 'Type')}</TableCell>
 <TableCell align="right">{t('billing.orders.amount', 'Amount')}</TableCell>
 <TableCell>{t('billing.orders.status', 'Status')}</TableCell>
 <TableCell>{t('billing.orders.createdAt', 'Created')}</TableCell>
 <TableCell>{t('billing.orders.paidAt', 'Paid At')}</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {paymentOrders.map((order) => (
 <TableRow key={order.id}>
 <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
 {order.outTradeNo.substring(0,20)}...
 </TableCell>
 <TableCell>
 <Chip label={getPaymentTypeLabel(order.type)} size="small" variant="outlined" />
 </TableCell>
 <TableCell align="right" sx={{ fontWeight:500 }}>
 {formatCurrency(order.money)}
 </TableCell>
 <TableCell>
 <Chip label={getStatusLabel(order.status)} color={getStatusColor(order.status)} size="small" />
 </TableCell>
 <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
 <TableCell>{order.paidAt ? new Date(order.paidAt).toLocaleString() : '-'}</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 ) : (
 <Typography sx={{ textAlign: 'center', py:4, color: 'text.secondary' }}>
 {t('billing.orders.empty', 'No payment orders yet')}
 </Typography>
 )}
 </CardContent>
 </Card>
 )}

 {activeTab ===1 && (
 <Card>
 <CardContent>
 <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>
 {t('billing.invoices')}
 </Typography>
 {billingInfo && billingInfo.invoices.length >0 ? (
 <TableContainer>
 <Table>
 <TableHead>
 <TableRow sx={{ backgroundColor: 'action.hover' }}>
 <TableCell>{t('billing.period')}</TableCell>
 <TableCell align="right">{t('billing.usage')}</TableCell>
 <TableCell align="right">{t('dashboard.totalCost')}</TableCell>
 <TableCell>{t('billing.status')}</TableCell>
 <TableCell>{t('billing.created')}</TableCell>
 <TableCell>{t('billing.dueDate')}</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {billingInfo.invoices.map((invoice) => (
 <TableRow key={invoice.id}>
 <TableCell sx={{ fontWeight:500 }}>{invoice.period}</TableCell>
 <TableCell align="right">{invoice.totalUsage}</TableCell>
 <TableCell align="right">{formatCurrency(invoice.totalCost)}</TableCell>
 <TableCell>
 <Chip
 label={getStatusLabel(invoice.status)}
 color={getStatusColor(invoice.status)}
 size="small"
 sx={{ textTransform: 'capitalize' }}
 />
 </TableCell>
 <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
 <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 ) : (
 <Typography sx={{ textAlign: 'center', py:4, color: 'text.secondary' }}>
 {t('billing.noInvoices')}
 </Typography>
 )}
 </CardContent>
 </Card>
 )}

 <Card sx={{ mt:4 }}>
 <CardContent>
 <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>
 {t('billing.billingInformation')}
 </Typography>
 <Typography variant="body2" sx={{ mb:1 }}>
 • {t('billing.prepaidModel')}
 </Typography>
 <Typography variant="body2" sx={{ mb:1 }}>
 • {t('billing.apiRequestDeduction')}
 </Typography>
 <Typography variant="body2" sx={{ mb:1 }}>
 • {t('billing.invoicesGenerated')}
 </Typography>
 <Typography variant="body2">• {t('billing.contactSupport')}</Typography>
 </CardContent>
 </Card>

 <Dialog open={redeemDialogOpen} onClose={() => setRedeemDialogOpen(false)} maxWidth="sm" fullWidth>
 <DialogTitle>{t('billing.redeem.title', 'Redeem Code')}</DialogTitle>
 <DialogContent sx={{ pt:2 }}>
 {redeemError && (
 <Alert severity="error" sx={{ mb:2 }}>
 {redeemError}
 </Alert>
 )}
 {redeemSuccess && (
 <Alert severity="success" sx={{ mb:2 }}>
 {redeemSuccess}
 </Alert>
 )}
 <TextField
 fullWidth
 label={t('billing.redeem.codeLabel', 'Redemption Code')}
 value={redeemCode}
 onChange={(e) => setRedeemCode(e.target.value)}
 disabled={redeemLoading}
 placeholder={t('billing.redeem.codePlaceholder', 'Enter your redemption code')}
 />
 </DialogContent>
 <DialogActions>
 <Button onClick={() => setRedeemDialogOpen(false)} disabled={redeemLoading}>
 {t('common.cancel', 'Cancel')}
 </Button>
 <Button onClick={handleRedeemCode} variant="contained" disabled={redeemLoading || !redeemCode.trim()}>
 {redeemLoading ? <CircularProgress size={24} /> : t('billing.redeem.confirm', 'Redeem')}
 </Button>
 </DialogActions>
 </Dialog>

 <Dialog open={chargeDialogOpen} onClose={() => setChargeDialogOpen(false)} maxWidth="sm" fullWidth>
 <DialogTitle>{t('billing.charge.title', 'Charge Balance')}</DialogTitle>
 <DialogContent sx={{ pt:2 }}>
 <TextField
 fullWidth
 label={t('billing.charge.amountLabel', 'Amount')}
 type="number"
 value={chargeAmount}
 onChange={(e) => setChargeAmount(e.target.value)}
 disabled={chargeLoading}
 inputProps={{ step: '0.01', min: '0.01' }}
 sx={{ mb:2 }}
 />
 <Box sx={{ mb: 2 }}>
 <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
 {t('billing.charge.quickAmount', 'Quick Amount')}
 </Typography>
 <Stack direction="row" spacing={1}>
 {['5', '10', '50', '100'].map((amount) => (
 <Button
 key={amount}
 variant="outlined"
 size="small"
 onClick={() => setChargeAmount(amount)}
 disabled={chargeLoading}
 sx={{ flex: 1 }}
 >
 {t('billing.charge.amountPrefix', '🔮')} {amount}
 </Button>
 ))}
 </Stack>
 </Box>
 <TextField
 fullWidth
 select
 label={t('billing.charge.methodLabel', 'Payment Method')}
 value={chargeType}
 onChange={(e) => setChargeType(e.target.value)}
 disabled={chargeLoading}
 SelectProps={{ native: true }}
 >
 <option value="alipay">{t('billing.paymentTypes.alipay', 'Alipay')}</option>
 <option value="wxpay">{t('billing.paymentTypes.wxpay', 'WeChat Pay')}</option>
 </TextField>
 <Alert severity="info" sx={{ mt: 2 }}>
 <Typography variant="body2">
 {t('billing.charge.contactSupport', 'If you encounter any payment issues, please contact support: {{email}}', {
 email: systemSettings.supportEmail
 })}
 </Typography>
 </Alert>
 </DialogContent>
 <DialogActions>
 <Button onClick={() => setChargeDialogOpen(false)} disabled={chargeLoading}>
 {t('common.cancel', 'Cancel')}
 </Button>
 <Button
 onClick={handleCharge}
 variant="contained"
 disabled={chargeLoading || !chargeAmount || parseFloat(chargeAmount) <=0}
 >
 {chargeLoading ? <CircularProgress size={24} /> : t('billing.charge.proceed', 'Proceed to Payment')}
 </Button>
 </DialogActions>
 </Dialog>
 </Container>
 );
}
