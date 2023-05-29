import mongoose from 'mongoose';
import Admin from '../../models/adminModel.js';
import Product from '../../models/productModel.js';
import User from '../../models/userDetailsModel.js';
import Category from '../../models/categoryModel.js';
import Brand from '../../models/brandModel.js';
import Coupon from '../../models/couponModel.js';
import Order from '../../models/orderModel.js';
import Banner from '../../models/bannerModel.js';
import * as fs from 'fs';
import * as path from 'path'
const __dirname = path.resolve()
const getAllProduct = () =>
  new Promise((resolve, reject) => {
    const products = Product.find({ available: true }).populate('brand').populate('category').exec();
    resolve(products);
  });

const getAllClients = () =>
  new Promise((resolve, reject) => {
    const users = User.find();
    if (users != null) {
      resolve(users);
    } else {
      reject(new Error('serverdan barcha mijozlarni olishda xato'));
    }
  });

const getAdminLogin = (req, res) => {
  if (req.session.adminLogIn) {
    res.redirect('/admin/dashboard');
  } else {
    const msg = req.flash('error');
    res.render('admin/login', { msg });
  }
};

const getAdminDashboard = async (req, res) => {
  req.session.pageIn = 'dashboard';
  const orders = await Order.find({}).sort({ _id: -1 }).limit(10).populate('userId').populate('address');
  const userCount = await User.find({});
  const totalSales = await Order.aggregate([
    {
      $match: { orderstat: 'DELIVERED' },
    },
    {
      $group: { _id: null, totalSales: { $sum: '$total' } },
    },
  ]);
  const orderCount = await Order.countDocuments({orderstat: 'CONFIRMED'})
  const pendingOrders = await Order.countDocuments({orderstat: 'DELIVERED'});
  const categoriseOrderCount = await Order.aggregate([
    { $project: { orderstat: 1 } },
    { $group: { _id: '$orderstat', count: { $sum: 1 } } },
  ]);
  const brandCount = await Order.aggregate([
    {
      $unwind: { path: '$products' },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'products.product.title',
        foreignField: 'title',
        as: 'productDetails',
      },
    },
    {
      $unwind: { path: '$productDetails' },
    },
    {
      $group: { _id: '$productDetails.brand', count: { $sum: '$products.quantity' } },
    },
    {
      $lookup: {
        from: 'brands',
        localField: '_id',
        foreignField: '_id',
        as: 'brandDetails',
      },
    },
    {
      $project: { 'brandDetails.title': 1, count: 1 },
    },
    { $sort: { 'brandDetails.title': 1 } },
  ]);

  const categoryNameArray = [];
  const categoryCountArray = [];
  categoriseOrderCount.forEach((el) => {
    categoryCountArray.push(el.count);
    categoryNameArray.push(el._id);
  });

  const brandCountArray = [];
  const brandNameArray = [];
  brandCount.forEach((el) => {
    brandCountArray.push(el.count);
    brandNameArray.push(el.brandDetails[0].title);
  });
  const msg = req.flash('success');
  res.render('admin/dashboard', {
    categoryNameArray,
    categoryCountArray,
    brandCountArray,
    brandNameArray,
    pendingOrders,
    totalSales: totalSales[0],
    orderCount,
    userCount: userCount.length,
    orders,
    msg,
    pageIn: req.session.pageIn,
    dashboardPage: ' text-gray-800 dark:text-gray-100',
    ordersPage: '',
    productsPage: '',
    bannerPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const getAdminOrders = async (req, res) => {
  const orders = await Order.find({}).sort({ _id: -1 }).populate('userId').populate('address');

  req.session.pageIn = 'orders';
  res.render('admin/orders', {
    orders,
    pageIn: req.session.pageIn,
    ordersPage: 'dark:text-gray-100',
    dashboardPage: '',
    productsPage: '',
    bannerPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};
const orderUpdate = async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.body.orderId, { orderstat: req.body.newOrderStatus });
  if (order) {
    res.json({
      orderUpdate: 'success',
    });
  } else {
    res.json({
      orderUpdate: 'failed',
    });
  }
};

const getEditProductPage = async (req, res) => {
  const brand = await Brand.find({});
  const category = await Category.find({});
  const product = await Product.find({ _id: mongoose.Types.ObjectId(req.params.id) })
    .populate('brand')
    .populate('category');
  const userId = req.params.id;
  req.session.pageIn = 'products';
  res.render('admin/edit_product', {
    brand,
    category,
    product: product[0],
    userId,
    pageIn: req.session.pageIn,
    productsPage: 'dark:text-gray-100',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const getAdminProducts = async (req, res) => {
  try {
    // console.log(await getAllProduct());
    const products = await getAllProduct();
    req.session.pageIn = 'products';
    res.render('admin/product_management', {
      products,
      pageIn: req.session.pageIn,
      productsPage: 'dark:text-gray-100',
      bannerPage: '',
      dashboardPage: '',
      ordersPage: '',
      usersPage: '',
      categoryPage: '',
      brandPage: '',
      couponPage: '',
      adminPage: ''
    });
  } catch (err) {
    res.status(400).json({
      status: 'no data in database',
      message: err,
    });
  }
};

const getAddProductPage = async (req, res) => {
  const brand = await Brand.find({});
  const category = await Category.find({});
  // console.log(brand, category);
  const msg = req.flash('error');
  req.session.pageIn = 'products';
  res.render('admin/add_product', {
    msg,
    brand,
    category,
    pageIn: req.session.pageIn,
    productsPage: 'dark:text-gray-100',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const editProduct = async (req, res) => {
  if (Object.keys(req.files).length === 0) {
    // console.log(req.body)
    await Product.findByIdAndUpdate(req.params.id, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    res.redirect('/admin/products');
  } else if (req.files.images === undefined && req.files.thumbnail.length !== 0) {
    const thumbnail = req.files.thumbnail[0].filename;
    Object.assign(req.body, { thumbnail });
    await Product.findByIdAndUpdate(req.params.id, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    res.redirect('/admin/products');
  } else if (req.files.thumbnail === undefined && req.files.images.length !== 0) {
    const img = [];
    req.files.forEach((el) => {
      img.push(el.filename);
    });
    Object.assign(req.body, { images: img });
    await Product.findByIdAndUpdate(req.params.id, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    res.redirect('/admin/products');
  } else {
    const img = [];
    const thumbnail = req.files.thumbnail[0].filename;
    req.files.forEach((el) => {
      img.push(el.filename);
    });
    Object.assign(req.body, { images: img, thumbnail });
    // const {title,brand,category,price,images,description}=req.body;
    // console.log(req.body)
    await Product.findByIdAndUpdate(req.params.id, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    res.redirect('/admin/products');
  }
};

const adminCheck = async (req, res) => {
  try {
    await Admin.findOne({ email: req.body.email }, (err, user) => {
      if (err) throw err;
      // test a matching password
      if (user != null) {
        user.comparePassword(req.body.password, (passErr, isMatch) => {
          if (passErr) throw passErr;
          if (isMatch) {
            // console.log('admin')
            req.session.adminLogIn = true;
            // console.log('SESSION CHECK',req.session)
            req.flash('success', 'Muvaffaqiyatli kirildi');
            res.redirect('/admin/dashboard');
          } else {
            // res.status(400).json({
            //   status: 'admin Password not match',
            //   message: err,
            // });
            req.flash('error', 'Parol mos emas');
            res.redirect('/admin');
          }
        });
      } else {
        req.flash('error', 'Email topilmadi');
        res.redirect('/admin');
      }
    });
  } catch (err) {
    res.render('admin/error-page');
  }
};

const uploadProduct = async (req, res) => {
  try {
    // console.log("form body: ", req.body);
    // console.log(req.files);
    const img = [];
    const uploadImg = req.body
    const thumbnail = req.files.thumbnail[0].filename;

    req.files.images.forEach((el) => {
      img.push(el.filename);
    });

    Object.assign(uploadImg, { images: img, thumbnail });
    // res.status(200).json({
    //   data:req.body,
    // })
    await Product.create(uploadImg)
    res.redirect('/admin/products')

  } catch (err) {
    req.flash('error', 'Mahsulotni maʼlumotlar bazasiga qoʻshishda xatolik yuz berdi');
    res.redirect('/admin/products/add-product');
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const users = await getAllClients();
    req.session.pageIn = 'users';
    res.render('admin/client', {
      users,
      pageIn: req.session.pageIn,
      usersPage: 'dark:text-gray-100',
      dashboardPage: '',
      ordersPage: '',
      productsPage: '',
      bannerPage: '',
      categoryPage: '',
      brandPage: '',
      couponPage: '',
      adminPage: ''
    });
  } catch (err) {
    res.status(400).json({
      status: "ma'lumotlar bazasida ma'lumotlar yo'q",
      message: err,
    });
  }
};
const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { block: true });
    res.redirect('/admin/clients');
  } catch (err) {
    res.status(400).json({
      status: 'blocking error',
      message: err,
    });
  }
};
const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { block: false });
    res.redirect('/admin/clients');
  } catch (err) {
    res.status(400).json({
      status: 'unblocking error',
      message: err,
    });
  }
};

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
  if(!product) {
    console.log('maxsulot topilmadi')
  }else {
    for(let i=0; i< product.images.length; i+=1){
      let imgPath = path.join(__dirname, `public/product_img/`,product.images[i])
      fs.unlink(imgPath, (err) => {
        if (err) {
          console.log('ochirishda xatolik yuz berdi')
        }
        else {
          console.log('ochirildi')
        }
      })
    }
    const thumbnailPath = path.join(__dirname, `public/product_img/`,product.thumbnail)
    
    fs.unlink(thumbnailPath,(err) => {
      if (err) {
        console.log('ochirishda xatolik yuz berdi')
      }
      else {
        console.log('ochirildi')
      }
    })
    product.delete()
    res.redirect('/admin/products');
    
  }
};
// const deleteCategory = async (req, res) => {
//   const category = await Category.findById(req.params.id)
//   if(!category) {
//     console.log('Category topilmadi')
//   }else {
//     const pathImg = path.join(__dirname, `public/category_img/`,category.image)
    
//     fs.unlink(pathImg,(err) => {
//       if (err) throw err
//     })
//     category.delete()
//     res.redirect('/admin/category');
    
//   }
// };

const getCategory = async (req, res) => {
  const category = await Category.find({});
  req.session.pageIn = 'category';
  res.render('admin/category', {
    pageIn: req.session.pageIn,
    category,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: 'dark:text-gray-100',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const getEditCategory = async (req, res) => {
  const catId = req.params.id;
  req.session.pageIn = 'category';
  const category = await Category.find({ _id: mongoose.Types.ObjectId(catId) });
  // console.log(category);
  res.render('admin/edit_category', {
    category,
    catId,
    pageIn: req.session.pageIn,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: 'dark:text-gray-100',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const getAddCategory = (req, res) => {
  req.session.pageIn = 'category';
  res.render('admin/add_category', {
    pageIn: req.session.pageIn,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: 'dark:text-gray-100',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const addCategory = async (req, res) => {
  try {
    // console.log(req.file)
    // console.log(req.body);

    const catInfo = req.body;
    const img = req.file.filename;
    // console.log(img)
    Object.assign(catInfo, { image: img });
    // console.log(catInfo);
    await Category.create(catInfo);
    res.redirect('/admin/category');
  } catch (err) {
    res.status(400).json({
      status: "Kategorya qo'shishda xatolik yuz berdi",
      message: err,
    });
  }
};
const editCategory = async (req, res) => {
  try {
    if (req.file === undefined) {
      // console.log(req.body)
      await Category.findByIdAndUpdate(req.params.id, req.body, {
        upsert: true,
        new: true,
        runValidators: true,
      });
      res.redirect('/admin/category');
    } else {
      // console.log(req.file)
      const catInfo = req.body;
      const img = req.file.filename;
      Object.assign(catInfo, { image: img });
      await Category.findByIdAndUpdate(catInfo);
      res.redirect('/admin/category');
    }
  } catch (err) {
    res.status(400).json({
      status: 'Kategoriyani tahrirlashda xato',
      message: err,
    });
  }
};

const getBrand = async (req, res) => {
  const brand = await Brand.find({});
  req.session.pageIn = 'brand';
  res.render('admin/brand', {
    pageIn: req.session.pageIn,
    brand,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: 'dark:text-gray-100',
    couponPage: '',
    adminPage: ''
  });
};

const getEditBrand = async (req, res) => {
  const brandId = req.params.id;
  req.session.pageIn = 'brand';
  const brand = await Brand.find({ _id: mongoose.Types.ObjectId(brandId) });
  // console.log(brand);
  res.render('admin/edit_brand', {
    brand,
    brandId,
    pageIn: req.session.pageIn,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: 'dark:text-gray-100',
    couponPage: '',
    adminPage: ''
  });
};

const getAddBrand = (req, res) => {
  req.session.pageIn = 'brand';
  res.render('admin/add_brand', {
    pageIn: req.session.pageIn,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: 'dark:text-gray-100',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const addBrand = async (req, res) => {
  try {
    const brandInfo = req.body;
    const img = req.file.filename;
    // console.log(img)
    Object.assign(brandInfo, { image: img });
    // console.log(brandInfo);
    await Brand.create(brandInfo);
    res.redirect('/admin/brand');
  } catch (err) {
    res.status(400).json({
      status: "brendni qo'shishda xatolik yuz berdi",
      message: err,
    });
  }
};

const editBrand = async (req, res) => {
  try {
    if (req.file === undefined) {
      // console.log(req.body)
      await Brand.findByIdAndUpdate(req.params.id, req.body, {
        upsert: true,
        new: true,
        runValidators: true,
      });
      res.redirect('/admin/brand');
    } else {
      // console.log(req.file)
      const brandInfo = req.body;
      const img = req.file.filename;
      Object.assign(brandInfo, { image: img });
      await Brand.findByIdAndUpdate(brandInfo);
      res.redirect('/admin/brand');
    }
  } catch (err) {
    res.status(400).json({
      status: 'brendni tahrirlashda xato',
      message: err,
    });
  }
};

const getBanner = async (req, res) => {
  const banner = await Banner.find({});
  req.session.pageIn = 'banner';
  res.render('admin/banner', {
    pageIn: req.session.pageIn,
    banner,
    productsPage: '',
    bannerPage: 'dark:text-gray-100',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const getEditBanner = async (req, res) => {
  const bannerId = req.params.id;
  req.session.pageIn = 'banner';
  const banner = await Banner.find({ _id: mongoose.Types.ObjectId(bannerId) });
  // console.log(brand);
  res.render('admin/edit_banner', {
    banner,
    bannerId,
    pageIn: req.session.pageIn,
    productsPage: '',
    bannerPage: 'dark:text-gray-100',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const getAddBanner = (req, res) => {
  req.session.pageIn = 'banner';
  res.render('admin/add_banner', {
    pageIn: req.session.pageIn,
    productsPage: '',
    bannerPage: 'dark:text-gray-100',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: '',
    adminPage: ''
  });
};

const addBanner = async (req, res) => {
  try {
    // console.log(req.file)
    // console.log(req.body);

    const bannerInfo = req.body;
    const img = req.file.filename;
    // console.log(img)
    Object.assign(bannerInfo, { image: img });
    // console.log(bannerInfo);
    await Banner.create(bannerInfo);
    res.redirect('/admin/banner');
  } catch (err) {
    res.status(400).json({
      status: "banner qo'shishda xatolik yuz berdi",
      message: err,
    });
  }
};

const editBanner = async (req, res) => {
  try {
    if (req.file === undefined) {
      // console.log(req.body)
      await Banner.findByIdAndUpdate(req.params.id, req.body, {
        upsert: true,
        new: true,
        runValidators: true,
      });
      res.redirect('/admin/banner');
    } else {
      // console.log(req.file)
      const bannerInfo = req.body;
      const img = req.file.filename;
      Object.assign(bannerInfo, { image: img });
      await Banner.findByIdAndUpdate(bannerInfo);
      res.redirect('/admin/banner');
    }
  } catch (err) {
    res.status(400).json({
      status: 'Bannerni tahrirlashda xatolik yuz berdi',
      message: err,
    });
  }
};
const getCoupon = async (req, res) => {
  const coupon = await Coupon.find({});
  req.session.pageIn = 'coupon';
  res.render('admin/coupon', {
    pageIn: req.session.pageIn,
    coupon,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: 'dark:text-gray-100',
    adminPage: ''
  });
};
const getAddCoupon = (req, res) => {
  req.session.pageIn = 'coupon';
  res.render('admin/add_coupon', {
    pageIn: req.session.pageIn,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: 'dark:text-gray-100',
    adminPage: ''
  });
};

const getEditCoupon = async (req, res) => {
  const couponId = req.params.id;
  req.session.pageIn = 'coupon';

  const coupon = await Coupon.find({ _id: mongoose.Types.ObjectId(couponId) });
  // console.log(brand);
  res.render('admin/edit_coupon', {
    coupon,
    couponId,
    pageIn: req.session.pageIn,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: 'dark:text-gray-100',
    adminPage: ''
  });
};
const editCoupon = async (req, res) => {
  try {
    const { code, isPercent, amount, usageLimit, minCartAmount, maxDiscountAmount } = req.body;
    // const createdAt = new Date();
    // let expireAfter = createdAt.getTime() + req.body.expireAfter * 24 * 60 * 60 * 1000;
    // expireAfter = new Date(expireAfter);
    const coupon = { code, isPercent, amount, usageLimit, minCartAmount, maxDiscountAmount };
    await Coupon.findByIdAndUpdate(req.params.id, coupon);
    res.redirect('/admin/coupon');
  } catch (err) {
    res.status(400).json({
      status: 'kuponi tahrirlashda xatolik yuz berdi',
      message: err,
    });
  }
};

const addCoupon = async (req, res) => {
  try {
    const { code, isPercent, amount, usageLimit, minCartAmount, maxDiscountAmount } = req.body;
    const createdAt = new Date();
    let expireAfter = createdAt.getTime() + req.body.expireAfter * 24 * 60 * 60 * 1000;
    expireAfter = new Date(expireAfter);
    const coupon = { code, isPercent, amount, usageLimit, expireAfter, createdAt, minCartAmount, maxDiscountAmount };
    await Coupon.create(coupon);
    res.redirect('/admin/coupon');
  } catch (err) {
    res.status(400).json({
      status: "Kuponni qo'shishda xato",
      message: err,
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.body.couponId);
    res.json({
      delete: 'success',
    });
  } catch (err) {
    res.json({
      delete: 'failed',
    });
  }
};

const salesReportGenerator = async (req, res) => {
  try {
    const productSales = await Order.aggregate([
      {
        $match: { orderstat: { $ne: 'CANCELLED' } },
      },
      {
        $unwind: { path: '$products' },
      },
      {
        $group: {
          _id: '$products.product._id',
          sold: { $sum: '$products.quantity' },
          sales: { $sum: '$products.subtotal' },
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'stock',
        },
      },
      {
        $project: { _id: 1, sold: 1, sales: 1, 'stock.stock': 1, 'stock.title': 1 },
      },
    ]);

    res.json({
      stat: 'success',
      report: productSales,
    });
  } catch (err) {
    res.json({
      stat: 'failed',
    });
  }
};

const getAddAdmin = async (req, res) => {
  req.session.pageIn = 'admin'
  res.render('admin/addAdmin', {
    pageIn: req.session.pageIn,
    productsPage: '',
    bannerPage: '',
    dashboardPage: '',
    ordersPage: '',
    usersPage: '',
    categoryPage: '',
    brandPage: '',
    couponPage: '',
    adminPage: "dark:text-gray-100"
  })
}

const addAdmin = async (req, res) => {
  const {email, password} = req.body
  await Admin.create({email, password})
  .then(() => {
    res.redirect('/admin/addAdmin')
  })
  .catch(err => {
    res.status(500).json({err: err})
  })
}

const adminLogout = async (req, res) => {
  req.session.adminLogIn = false;
  res.redirect('/admin');
};

export {
  getAdminLogin,
  getAdminDashboard,
  getAdminOrders,
  getAdminProducts,
  getAdminUsers,
  getAddProductPage,
  uploadProduct,
  getEditProductPage,
  editProduct,
  blockUser,
  getCategory,
  getEditCategory,
  getAddCategory,
  addCategory,
  editCategory,
  // deleteCategory,
  getBrand,
  getEditBrand,
  getAddBrand,
  addBrand,
  editBrand,
  adminLogout,
  unblockUser,
  deleteProduct,
  adminCheck,
  getBanner,
  getAddBanner,
  addBanner,
  orderUpdate,
  getEditBanner,
  editBanner,
  getCoupon,
  getAddCoupon,
  addCoupon,
  getEditCoupon,
  editCoupon,
  salesReportGenerator,
  deleteCoupon,
  getAddAdmin,
  addAdmin,
};