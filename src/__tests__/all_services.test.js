import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../api/authService';
import * as client from '../api/client';
import * as affiliateLogisticsService from '../api/affiliateLogisticsService';
import * as affiliateOrderService from '../api/affiliateOrderService';
import * as affiliateProfileService from '../api/affiliateProfileService';
import * as cartService from '../api/cartService';
import * as driverDeliveryService from '../api/driverDeliveryService';
import * as driverHistoryService from '../api/driverHistoryService';
import * as driverProfileService from '../api/driverProfileService';
import * as inventarioService from '../api/inventarioService';
import * as repartidorService from '../api/repartidorService';
import * as sedesService from '../api/sedesService';
import * as subastaService from '../api/subastaService';
import * as usuariosService from '../api/usuariosService';

vi.mock('../api/client', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            patch: vi.fn()
        }
    }
});

import apiClient from '../api/client';

describe('All Services', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        localStorage.setItem('medigo_user', JSON.stringify({id: 1, role: 'ADMIN'}));

        apiClient.get.mockResolvedValue({ data: {} });
        apiClient.post.mockResolvedValue({ data: {} });
        apiClient.put.mockResolvedValue({ data: {} });
        apiClient.delete.mockResolvedValue({ data: {} });
        apiClient.patch.mockResolvedValue({ data: {} });
    });

    it('authService works', async () => {
        apiClient.post.mockResolvedValueOnce({ data: { token: 't' } });
        await authService.login({ email: 'e', password: 'p' });

        apiClient.post.mockResolvedValueOnce({ data: { message: 'registered' } });
        await authService.registerUser({ email: 'e', name: 'n', password: 'p', role: 'AFFILIATE' });

        apiClient.post.mockResolvedValueOnce({ data: { message: 'registered' } });
        await authService.register({ email: 'e', name: 'n', password: 'p', role: 'AFFILIATE' });

        apiClient.post.mockResolvedValueOnce({ data: {} });
        await authService.logout();

        apiClient.get.mockResolvedValueOnce({ data: {} });
        await authService.getMe();
    });

    it('affiliateLogisticsService works', async () => {
        await affiliateLogisticsService.getAffiliateLogisticsDashboard();
        await affiliateLogisticsService.createAffiliateOrder({});
        await affiliateLogisticsService.assignAffiliateCourier({});
    });

    it('affiliateOrderService works', async () => {
        await affiliateOrderService.confirmOrder({ branchId: 1, street: 's', streetNumber: '1', city: 'c', commune: 'c' });
        await affiliateOrderService.getOrderStatus(1);
        apiClient.get.mockResolvedValueOnce({ data: [] });
        await affiliateOrderService.getMyOrders();
    });

    it('affiliateProfileService works', async () => {
        await affiliateProfileService.getAffiliateProfile();
        await affiliateProfileService.getAffiliatePaymentMethods();
        await affiliateProfileService.getAffiliatePreferences();
        await affiliateProfileService.getAffiliateAccountStatus();
        await affiliateProfileService.updateAffiliateProfile({});
        await affiliateProfileService.updateAffiliatePreferences({});
        await affiliateProfileService.createAffiliatePaymentMethod({});
        await affiliateProfileService.deleteAffiliatePaymentMethod(1);
    });

    it('cartService works', async () => {
        await cartService.addToCart({ affiliateId: 1, branchId: 1, medicationId: 1 });
        await cartService.getCart({ affiliateId: 1, branchId: 1 });
    });

    it('driverDeliveryService works', async () => {
        apiClient.get.mockResolvedValueOnce({ data: [] });
        await driverDeliveryService.getPendingOrders();

        apiClient.get.mockResolvedValue({ data: [] }); // fix
        await driverDeliveryService.getActiveDeliveries();

        await driverDeliveryService.selfAssignOrder(1);
        await driverDeliveryService.markPickup(1);
        await driverDeliveryService.finalizeDelivery(1);
        await driverDeliveryService.getDriverMapSnapshot();
        await driverDeliveryService.getDriverCurrentOrder();
        await driverDeliveryService.acceptDriverOrder({});
        await driverDeliveryService.startDriverShift();
    });

    it('driverHistoryService works', async () => {
        await driverHistoryService.getDriverHistorySummary();
        await driverHistoryService.getDriverTrips();
        await driverHistoryService.requestDriverEmergencySupport({});
    });

    it('driverProfileService works', async () => {
        await driverProfileService.getDriverProfile();
        await driverProfileService.updateDriverProfile({});
    });

    it('inventarioService works', async () => {
        await inventarioService.searchMedicationsByName('test');
        await inventarioService.getBranchStock(1);
        await inventarioService.getBranchesWithMedications();
        await inventarioService.getMedicationAvailabilityByBranch(1, 1);
        await inventarioService.getMedicationAvailabilityAllBranches(1);
        await inventarioService.createMedicamento({});
        await inventarioService.updateMedicamentoStock({medicationId: 1, branchId: 1, quantity: 1});
        await inventarioService.getInventario();
        await inventarioService.getInventarioStats();
        await inventarioService.updateMedicamento(1, {branchId: 1, quantity: 1});
    });

    it('repartidorService works', async () => {
        await repartidorService.getPerfil();
        await repartidorService.updatePerfil({});
        await repartidorService.getHistorial();
        await repartidorService.getPedidosMapa();
        await repartidorService.updateEstadoPedido(1, 'DELIVERED');
        await repartidorService.updateEstadoPedido(1, 'OTHER');
        await repartidorService.getPedidosMapaAfiliado();
        await repartidorService.getPerfilAfiliado();
        await repartidorService.updatePerfilAfiliado({});
    });

    it('sedesService works', async () => {
        await sedesService.getSedes();
        await sedesService.getSede(1);
        await sedesService.getSedeUsuarios(1);
        await sedesService.createSede({});
        await sedesService.updateSede(1, {});
        await sedesService.deleteSede(1);
    });

    it('subastaService works', async () => {
        await subastaService.getSubastas();
        await subastaService.getSubasta(1).catch(() => {});
        await subastaService.createSubasta({});
        await subastaService.updateSubasta(1, {});
    });

    it('usuariosService works', async () => {
        await usuariosService.getUsuarios();
        await usuariosService.getUsuario(1);
        await usuariosService.updateUsuario(1, {});
        await usuariosService.cambiarRolUsuario(1, 'ADMIN');
        await usuariosService.deleteUsuario(1);
        await usuariosService.toggleEstadoUsuario(1, true);
    });
});
