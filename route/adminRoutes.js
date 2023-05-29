import express from 'express';
import {
  getAdminLogin,
  getAdminDashboard,
  getAdminOrders,
  getAdminProducts,
  adminCheck,
  getAddProductPage,
  uploadProduct,
  getEditProductPage,
  editProduct,
  blockUser,
  unblockUser,
  getCategory,
  getEditCategory,
  getAddCategory,
  addCategory,
  editCategory,
  getBrand,
  getEditBrand,
  getAddBrand,
  // deleteCategory,
  addBrand,
  editBrand,
  deleteProduct,
  adminLogout,
  getAdminUsers,
  getBanner,
  getAddBanner,
  addBanner,
  getEditBanner,
  orderUpdate,
  editBanner,
  getCoupon,
  getAddCoupon,
  addCoupon,
  salesReportGenerator,
  getEditCoupon,
  deleteCoupon,
  editCoupon,
  getAddAdmin,
  addAdmin,
} from '../controllers/admin/adminController.js';
import { uploadMultiple, uploadOne, uploadBannerImg, uploadBrandImg } from '../middleware/multerMiddleware.js';
import adminLoginCheck from '../middleware/adminLoginCheckMiddleware.js';

const router = express.Router();

router.route('/').get(getAdminLogin).post(adminCheck);
router.route('/logout').get(adminLogout);
router.route('/dashboard').get(adminLoginCheck, getAdminDashboard);
router.route('/orders').get(adminLoginCheck, getAdminOrders);
router.route('/update-order').post(orderUpdate);
router.route('/products').get(adminLoginCheck, getAdminProducts);
router.route('/products/add-product').get(adminLoginCheck, getAddProductPage).post(uploadMultiple, uploadProduct);
router.route('/products/edit-product/:id').get(adminLoginCheck, getEditProductPage).post(uploadMultiple, editProduct);
// router.route('/products/delete-product/:id').get(adminLoginCheck, deleteProduct);
router.route('/clients').get(adminLoginCheck, getAdminUsers);
router.route('/clients/block/:id').get(adminLoginCheck, blockUser);
router.route('/clients/unblock/:id').get(adminLoginCheck, unblockUser);
router.route('/category').get(adminLoginCheck, getCategory);
router
  .route('/category/add-category')
  .get(adminLoginCheck, getAddCategory)
  .post(adminLoginCheck, uploadOne, addCategory);
router
  .route('/category/edit-category/:id')
  .get(adminLoginCheck, getEditCategory)
  .post(adminLoginCheck, uploadOne, editCategory);
  // router.route('/category/delete-category/:id').get(adminLoginCheck, deleteCategory);
router.route('/brand').get(adminLoginCheck, getBrand);
router.route('/brand/add-brand').get(adminLoginCheck, getAddBrand).post(adminLoginCheck, uploadBrandImg, addBrand);
router
  .route('/brand/edit-brand/:id')
  .get(adminLoginCheck, getEditBrand)
  .post(adminLoginCheck, uploadBrandImg, editBrand);
router.route('/banner').get(adminLoginCheck, getBanner);
router.route('/banner/add-banner').get(adminLoginCheck, getAddBanner).post(adminLoginCheck, uploadBannerImg, addBanner);
router
  .route('/banner/edit-banner/:id')
  .get(adminLoginCheck, getEditBanner)
  .post(adminLoginCheck, uploadBannerImg, editBanner);
router.route('/coupon').get(adminLoginCheck, getCoupon);
router.route('/coupon/add-coupon').get(adminLoginCheck, getAddCoupon).post(adminLoginCheck, addCoupon);
router.route('/coupon/edit-coupon/:id').get(adminLoginCheck, getEditCoupon).post(adminLoginCheck, editCoupon);
router.route('/coupon/delete-coupon').post(adminLoginCheck, deleteCoupon);
router.route('/sales-report').post(adminLoginCheck, salesReportGenerator);
router.route('/addAdmin').get(adminLoginCheck, getAddAdmin).post(adminLoginCheck, addAdmin)
// router.route('/addAdmin/pushAdmin')
export default router;