const Product = require('../models/productsModel');
const crypto = require('crypto');

exports.createProduct = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      console.error('User ID is missing');
      return res.status(400).send({ message: 'User ID is missing' });
    }

    const { manufacturerInformation, productInformation, packageInformation } = req.body;
    const { productName, productCategory, productDescription, issn } = productInformation;

    if (!productName || !productCategory || !productDescription || !issn) {
      console.error('Missing required fields');
      return res.status(400).send({ message: 'Missing required fields' });
    }

    // Calculate the number of codes to generate
    const totalProducts = packageInformation.productsPerPackage * packageInformation.howManyPackage;

    // Generate unique codes for each product in the package
    const productCodes = [];
    for (let i = 0; i < totalProducts; i++) {
      const uniqueCode = crypto.randomBytes(8).toString('hex');
      productCodes.push(uniqueCode);
    }
    packageInformation.productCodes = productCodes;

    const newProduct = new Product({
      manufacturerInformation,
      productInformation,
      packageInformation,
      userId,
    });

    await newProduct.save();

    const blockchainAddress = `mock-blockchain-address-${newProduct._id}`;

    res.status(201).send({ message: 'Product created successfully', blockchainAddress });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).send({ message: 'Failed to create product', error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  const userId = req.user?.id || req.query.userId;
  if (!userId) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {
    const products = await Product.find({ userId });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send({ message: 'Failed to fetch products', error: error.message });
  }
};

exports.getProductByUniqueCode = async (req, res) => {
  const { uniqueCode } = req.query;
  const userId = req.user?.id || req.query.userId;

  if (!userId) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {
    const product = await Product.findOne({
      'packageInformation.productCodes': uniqueCode,
      userId,
    });

    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).send({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).send({ message: 'Failed to fetch product', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  const productId = req.params.id;
  const { productName, productCategory, productDescription, issn } = req.body;
  const userId = req.user?.id || req.body.userId;

  if (!userId) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {
    const product = await Product.findOneAndUpdate(
      { _id: productId, userId },
      { productName, productCategory, productDescription, issn },
      { new: true }
    );

    if (!product) {
      return res.status(404).send({ message: 'Product not found or unauthorized' });
    }

    // Assuming you have a function to interact with a blockchain contract
    const contract = await getContractWithRetry(userId);
    await submitTransactionWithRetry(contract, 'updateProduct', JSON.stringify(product));

    res.status(200).send({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).send({ message: 'Failed to update product', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  const productId = req.params.id;
  const userId = req.user?.id || req.body.userId;

  if (!userId) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {
    const product = await Product.findOneAndDelete({ _id: productId, userId });

    if (!product) {
      return res.status(404).send({ message: 'Product not found or unauthorized' });
    }

    // Assuming you have a function to interact with a blockchain contract
    const contract = await getContractWithRetry(userId);
    await submitTransactionWithRetry(contract, 'deleteProduct', productId);

    res.status(200).send({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).send({ message: 'Failed to delete product', error: error.message });
  }
};
