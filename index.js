const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PORT = 3000;
const ORIGEN_API = 'http://localhost/integrativa';
const DESTINO_API = 'http://localhost:5107';

app.get('/sync_category', async (req, res) => {
  try {
    console.log('Inicio sincronización de categorías.');

    // 1. Obtener categorías del origen
    console.log('Obteniendo categorías del origen...');
    const origenResponse = await axios.get(`${ORIGEN_API}/categorias`);
    const categoriasOrigen = origenResponse.data?.data || [];
    console.log(`Obtenidas ${categoriasOrigen.length} categorías del origen.`);

    // 2. Obtener categorías del destino
    console.log('Obteniendo categorías del destino...');
    const destinoResponse = await axios.get(`${DESTINO_API}/categorias`);
    const categoriasDestino = destinoResponse.data || [];
    console.log(`Obtenidas ${categoriasDestino.length} categorías del destino.`);

    // 3. Crear conjunto de IDs existentes en destino para comparar fácilmente
    const destinosIds = new Set(categoriasDestino.map(cat => cat.categoryID));

    // 4. Filtrar categorías que no existen en destino
    const nuevasCategorias = categoriasOrigen
      .filter(cat => !destinosIds.has(cat.id_categoria))
      .map(cat => ({
        categoryID: cat.id_categoria,
        categoryName: cat.nombre,
        isActive: Boolean(cat.activo),
      }));

    console.log(`Se encontraron ${nuevasCategorias.length} nuevas categorías para sincronizar.`);

    if (nuevasCategorias.length === 0) {
      console.log('No hay categorías nuevas para sincronizar.');
      return res.json({ success: true, message: 'No hay categorías nuevas para sincronizar.' });
    }

    // 5. Enviar las nuevas categorías a destino vía POST
    console.log('Enviando nuevas categorías al destino...');
    const postResponse = await axios.post(`${DESTINO_API}/categorias`, nuevasCategorias);
    
    console.log('Nuevas categorías enviadas correctamente.');

    // 6. Responder con éxito y detalles
    res.json({
      success: true,
      sincronizadas: nuevasCategorias.length,
      respuestaDestino: postResponse.data,
    });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error de Axios en /sync_category:');
      if (error.response) {
        console.error(`Respuesta con status ${error.response.status}:`, error.response.data);
      } else if (error.request) {
        console.error('No se recibió respuesta:', error.request);
      } else {
        console.error('Error en configuración de la petición:', error.message);
      }
    } else {
      console.error('Error inesperado en /sync_category:', error.stack || error);
    }

    res.status(500).json({
      success: false,
      message: 'Error sincronizando categorías',
      error: error.message,
    });
  }
});


app.get('/sync_product', async (req, res) => {
  try {
    console.log('Inicio sincronización de productos.');

    // 1. Obtener productos del origen
    console.log('Obteniendo productos del origen...');
    const origenResponse = await axios.get(`${ORIGEN_API}/productos`);
    const productosOrigen = origenResponse.data?.data || [];
    console.log(`Obtenidos ${productosOrigen.length} productos del origen.`);

    // 2. Obtener productos del destino
    console.log('Obteniendo productos del destino...');
    const destinoResponse = await axios.get(`${DESTINO_API}/productos`);
    const productosDestino = destinoResponse.data || [];
    console.log(`Obtenidos ${productosDestino.length} productos del destino.`);

    // 3. Crear conjunto de IDs existentes en destino para comparar fácilmente
    const destinoIds = new Set(productosDestino.map(p => p.productID));

    // 4. Filtrar productos que no existen en destino y mapear al formato destino
    const nuevosProductos = productosOrigen
      .filter(p => !destinoIds.has(p.id_producto))
      .map(p => ({
        productID: p.id_producto,
        sku: p.sku,
        productName: p.nombre,
        categoryID: p.id_categoria,
        price: parseFloat(p.precio),
        stock: p.stock,
        isActive: Boolean(p.activo),
      }));

    console.log(`Se encontraron ${nuevosProductos.length} nuevos productos para sincronizar.`);

    if (nuevosProductos.length === 0) {
      console.log('No hay productos nuevos para sincronizar.');
      return res.json({ success: true, message: 'No hay productos nuevos para sincronizar.' });
    }

    // 5. Enviar los nuevos productos a destino vía POST
    console.log('Enviando nuevos productos al destino...');
    const postResponse = await axios.post(`${DESTINO_API}/productos`, nuevosProductos);

    console.log('Nuevos productos enviados correctamente.');

    // 6. Responder con éxito y detalles
    res.json({
      success: true,
      sincronizados: nuevosProductos.length,
      respuestaDestino: postResponse.data,
    });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error de Axios en /sync_product:');
      if (error.response) {
        console.error(`Respuesta con status ${error.response.status}:`, error.response.data);
      } else if (error.request) {
        console.error('No se recibió respuesta:', error.request);
      } else {
        console.error('Error en configuración de la petición:', error.message);
      }
    } else {
      console.error('Error inesperado en /sync_product:', error.stack || error);
    }

    res.status(500).json({
      success: false,
      message: 'Error sincronizando productos',
      error: error.message,
    });
  }
});



app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
