const test = require('node:test');
const assert = require('node:assert/strict');

const guard = require('../js/route-access.js');
const { resolveRouteAccess, sellerWorkspaceSection, dashboardFor } = guard;

const PROTECTED_SAMPLES = ['#/seller-center', '#/seller/orders', '#/admin-dashboard', '#/profile', '#/orders', '#/cart', '#/checkout', '#/wishlist', '#/notifications'];

test('a still-loading session blocks every protected route before any user or role check', () => {
  for (const hash of PROTECTED_SAMPLES) {
    assert.deepEqual(resolveRouteAccess(hash, { loading: true, user: null }).kind, 'loading', hash);
    assert.deepEqual(resolveRouteAccess(hash, { loading: true, user: { id: '1', role: 'BUYER' } }).kind, 'loading', hash);
    assert.deepEqual(resolveRouteAccess(hash, { loading: true, user: { id: '1', role: 'SELLER' } }).kind, 'loading', hash);
  }
});

test('the loading answer never hides a redirect target from the caller', () => {
  const decision = resolveRouteAccess('#/admin-dashboard', { loading: true, user: null });
  assert.equal(decision.kind, 'loading');
  assert.equal(decision.route, '#/admin-dashboard');
});

test('a signed-out visitor is sent to the sign-in page that fits the route', () => {
  const session = { loading: false, user: null };
  assert.equal(resolveRouteAccess('#/admin-dashboard', session).kind, 'redirect');
  assert.equal(resolveRouteAccess('#/admin-dashboard', session).to, '#/admin-login');
  assert.equal(resolveRouteAccess('#/seller-center', session).to, '#/auth');
  assert.equal(resolveRouteAccess('#/profile', session).to, '#/auth');
});

test('a signed-in account with the wrong role gets the 403 answer instead of a silent redirect', () => {
  const buyer = { loading: false, user: { id: '7', role: 'BUYER' } };
  assert.equal(resolveRouteAccess('#/admin-dashboard', buyer).kind, 'forbidden');
  assert.equal(resolveRouteAccess('#/seller-center', buyer).kind, 'forbidden');
  const seller = { loading: false, user: { id: '8', role: 'SELLER' } };
  assert.equal(resolveRouteAccess('#/admin-dashboard', seller).kind, 'forbidden');
});

test('the matching role is allowed through', () => {
  assert.equal(resolveRouteAccess('#/seller-center', { loading: false, user: { id: '8', role: 'SELLER' } }).kind, 'allow');
  assert.equal(resolveRouteAccess('#/admin-dashboard', { loading: false, user: { id: '9', role: 'ADMIN' } }).kind, 'allow');
  assert.equal(resolveRouteAccess('#/admin-dashboard', { loading: false, user: { id: '10', role: 'SUPER_ADMIN' } }).kind, 'allow');
  assert.equal(resolveRouteAccess('#/orders', { loading: false, user: { id: '11', role: 'BUYER' } }).kind, 'allow');
});

test('public routes stay public for guests and are never gated by role', () => {
  const guests = ['#/', '#/marketplace', '#/product/abc', '#/store/slug', '#/seller/signup', '#/seller/application', '#/admin-login', '#/admin-signup', '#/help'];
  for (const hash of guests) {
    assert.deepEqual(resolveRouteAccess(hash, { loading: false, user: null }).kind, 'public', hash);
    assert.deepEqual(resolveRouteAccess(hash, { loading: true, user: null }).kind, 'public', `${hash} while loading`);
  }
});

test('unknown routes are public so the router can render the branded 404 page', () => {
  assert.equal(resolveRouteAccess('#/this-page-does-not-exist', { loading: false, user: null }).kind, 'public');
});

test('seller workspace prefixes are protected while storefront slugs are not', () => {
  assert.equal(sellerWorkspaceSection('#/seller-center'), 'dashboard');
  assert.equal(sellerWorkspaceSection('#/seller-center/orders'), 'dashboard');
  assert.equal(sellerWorkspaceSection('#/seller/earnings'), 'earnings');
  assert.equal(sellerWorkspaceSection('#/seller/products/new'), 'products');
  assert.equal(sellerWorkspaceSection('#/seller/messages'), 'messages');
  assert.equal(sellerWorkspaceSection('#/seller/anime-shrine'), '');
  assert.equal(sellerWorkspaceSection('#/seller/signup'), '');
});

test('account routes cover nested and query variants', () => {
  const session = { loading: false, user: null };
  for (const hash of ['#/profile', '#/profile/settings', '#/orders?status=all', '#/cart', '#/notifications']) {
    assert.equal(resolveRouteAccess(hash, session).kind, 'redirect', hash);
  }
});

test('the control room alias is treated as an admin route', () => {
  const buyer = { loading: false, user: { id: '7', role: 'BUYER' } };
  assert.equal(resolveRouteAccess('#/control-room', buyer).kind, 'forbidden');
  assert.equal(resolveRouteAccess('#/control-room/users', buyer).kind, 'forbidden');
});

test('a malformed percent-escape in a typed URL cannot throw inside the guard', () => {
  assert.equal(sellerWorkspaceSection('#/seller/%E0%A4%A'), '');
  assert.equal(resolveRouteAccess('#/seller/%E0%A4%A', { loading: false, user: null }).kind, 'public');
  assert.equal(resolveRouteAccess('#/seller/%', { loading: true, user: null }).kind, 'public');
});

test('dashboardFor sends each account type to its own home', () => {
  assert.equal(dashboardFor({ role: 'SUPER_ADMIN' }), '#/admin-dashboard');
  assert.equal(dashboardFor({ role: 'SELLER' }), '#/seller-center');
  assert.equal(dashboardFor({ role: 'BUYER' }), '#/marketplace');
  assert.equal(dashboardFor(null), '#/auth');
});
