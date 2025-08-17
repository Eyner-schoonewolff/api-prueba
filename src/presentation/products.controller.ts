import { Controller, Get } from '@nestjs/common';
import { ApiSecurity, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';

@ApiTags('Products')
@ApiSecurity('api-key')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener lista de productos' })
  async list() {
    return this.products.list();
  }
}