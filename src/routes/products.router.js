import { Router } from "express";
import { productModel } from "../dao/models/products.model.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const limit = req.query.limit;
    const products = await productModel.find();
    if (limit) {
      const limitedProducts = products.slice(0, limit);
      res.json(limitedProducts);
    } else {
      res.json({ products: products });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    // Obtenemos el ID del producto de req.params
    const pid = req.params.pid;
    // Obtenemos el producto por ID
    const product = await productModel.findById(pid);
    // Enviamos un mensaje de error si no se encuentra el producto
    if (product === null) {
      return res.status(404).json({ error: `The product does not exist` });
    }
    // Enviamos el producto como respuesta si se encuentra
    res.json({ payload: product });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "error en el servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const product = req.body;
    const addProduct = await productModel.create(product);
    const products = await productModel.find().lean().exec();
    req.app.get("socketio").emit("updatedProducts", products);
    res.status(201).json({ status: "success", payload: addProduct });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

router.put("/:pid", async (req, res) => {
  try {
    // Obtenemos el ID del producto de req.params
    const pid = req.params.pid;
    // Comprobamos si el ID del producto en el cuerpo de la solicitud es igual al ID en los parámetros de la ruta
    if (req.body.id !== pid && req.body.id !== undefined) {
      return res
        .status(404)
        .json({ error: "No se puede modificar el id del producto" });
    }
    const updated = req.body;
    // Buscamos el producto por su ID en la lista de productos
    const productFind = await productModel.findById(pid);
    // Enviamos un mensaje de error si no se encuentra el producto
    if (!productFind) {
      return res.status(404).json({ error: `The product does not exist` });
    }
    // Actualizamos el producto
    await productModel.updateOne({ _id: pid }, updated);
    const updatedProducts = await productModel.find();

    req.app.get("socketio").emit("updatedProducts", updatedProducts);
    res.json({ message: `Actualizando el producto: ${productFind.title}` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
});

router.delete("/:pid", async (req, res) => {
  try {
    // Obtenemos el ID del producto de req.params
    const productId = req.params.pid;
    const result = await productModel.findByIdAndDelete(productId);
    if (result === null) {
      return res.status(404).json({
        status: "error",
        error: `No such product with id: ${productId}`,
      });
    }
    // Obtener la lista actualizada de productos
    const updatedProducts = await productModel.find().lean().exec();
    // Emitir el evento "updatedProducts" con la lista de productos actualizada
    req.app.get("socketio").emit("updatedProducts", updatedProducts);
    res.json({
      message: `Product with id ${productId} removed successfully`,
      products: updatedProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;