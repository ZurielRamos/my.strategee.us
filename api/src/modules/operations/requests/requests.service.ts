import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from './entities/request.entity';
import { RequestStrategyFactory } from './factories/request-strategy.factory';
import { RequestStatus } from './enums/request-status.enum';
import { CreateRequestDto } from './dto/create-request.dto';
import { FilterRequestsDto } from './dto/filter-request.dto';
import { PaginatedResult } from '@common/interfaces/pagination.interface';
import { ProcessRequestDto } from './dto/processs-request.dto';

@Injectable()
export class RequestsService {
    constructor(
        @InjectRepository(Request)
        private requestRepository: Repository<Request>,
        private strategyFactory: RequestStrategyFactory,
        private eventEmitter: EventEmitter2,
    ) { }

    async create(employeeId: string, createDto: CreateRequestDto): Promise<Request> {
        // 1. Obtener la estrategia correcta según el 'type'
        const strategy = this.strategyFactory.getStrategy(createDto.type);

        // 2. Delegar la validación de los detalles a la estrategia
        await strategy.validate(createDto.details, employeeId);

        // 3. Procesar datos antes de guardar (si la estrategia lo requiere)
        const processedDetails = await strategy.processBeforeSave(createDto.details, employeeId);

        // 4. Crear y Guardar la solicitud
        const newRequest = this.requestRepository.create({
            employeeId,
            type: createDto.type,
            details: processedDetails,
            status: RequestStatus.PENDING,
        });

        return this.requestRepository.save(newRequest);
    }

    async findAllByEmployee(employeeId: string, queryDto?: FilterRequestsDto): Promise<PaginatedResult<Request>> {
        console.log('findAllByEmployee called with:', { employeeId, queryDto });
        const { page = 1, limit = 20, sortBy = 'createdAt', order = 'DESC' } = queryDto || {};
        const offset = (page - 1) * limit;

        // 1. Iniciar QueryBuilder
        const queryBuilder = this.requestRepository.createQueryBuilder('request');

        // 2. Filtrar por empleado
        queryBuilder.where('request.employeeId = :employeeId', { employeeId });

        // 3. Aplicar Filtros Dinámicos
        if (queryDto?.type) {
            queryBuilder.andWhere('request.type = :type', { type: queryDto.type });
        }

        if (queryDto?.status) {
            queryBuilder.andWhere('request.status = :status', { status: queryDto.status });
        }

        // Filtro de Rango de Fechas (createdAt)
        if (queryDto?.dateFrom) {
            queryBuilder.andWhere('request.createdAt >= :dateFrom', {
                dateFrom: `${queryDto.dateFrom} 00:00:00`
            });
        }

        if (queryDto?.dateTo) {
            queryBuilder.andWhere('request.createdAt <= :dateTo', {
                dateTo: `${queryDto.dateTo} 23:59:59`
            });
        }

        // 4. Ordenación y Paginación
        const safeSortBy = ['createdAt', 'id', 'status', 'type'].includes(sortBy) ? `request.${sortBy}` : 'request.createdAt';

        queryBuilder
            .orderBy(safeSortBy, order === 'DESC' ? 'DESC' : 'ASC')
            .skip(offset)
            .take(limit);

        // 5. Ejecutar
        const [items, totalItems] = await queryBuilder.getManyAndCount();

        // 6. Mapear Respuesta
        const totalPages = Math.ceil(totalItems / limit);

        const result = {
            data: items,
            meta: {
                page,
                limit,
                total: totalItems,
                totalPages,
            },
        };

        console.log('findAllByEmployee result:', { 
            dataLength: items.length, 
            total: totalItems, 
            totalPages,
            page,
            limit 
        });

        return result;
    }


    async findAll(queryDto: FilterRequestsDto): Promise<PaginatedResult<Request>> {
        const { page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = queryDto;
        const offset = (page - 1) * limit;

        // 1. Iniciar QueryBuilder
        const queryBuilder = this.requestRepository.createQueryBuilder('request');

        // 2. Unir con Empleado (Necesitamos saber quién hizo la solicitud)
        // Seleccionamos solo campos clave para no exponer info sensible innecesaria
        queryBuilder.leftJoinAndSelect('request.employee', 'employee');

        // 3. Aplicar Filtros Dinámicos

        if (queryDto.type) {
            queryBuilder.andWhere('request.type = :type', { type: queryDto.type });
        }

        if (queryDto.status) {
            queryBuilder.andWhere('request.status = :status', { status: queryDto.status });
        }

        if (queryDto.employeeId) {
            queryBuilder.andWhere('request.employeeId = :employeeId', { employeeId: queryDto.employeeId });
        }

        // Filtro de Rango de Fechas (createdAt)
        if (queryDto.dateFrom) {
            queryBuilder.andWhere('request.createdAt >= :dateFrom', {
                dateFrom: `${queryDto.dateFrom} 00:00:00` // Inicio del día
            });
        }

        if (queryDto.dateTo) {
            queryBuilder.andWhere('request.createdAt <= :dateTo', {
                dateTo: `${queryDto.dateTo} 23:59:59` // Fin del día
            });
        }

        // Search support - commenting out since  not in DTO
        // if (queryDto.search) {
        //     queryBuilder.andWhere(
        //         '(request.id LIKE :search OR request.reviewerComment LIKE :search)',
        //         { search: `%${queryDto.search}%` }
        //     );
        // }

        // 4. Ordenación y Paginación
        // Aseguramos que el sort sea seguro (solo campos de request)
        const safeSortBy = ['createdAt', 'id', 'status', 'type'].includes(sortBy) ? `request.${sortBy}` : 'request.createdAt';

        queryBuilder
            .orderBy(safeSortBy, order === 'DESC' ? 'DESC' : 'ASC')
            .skip(offset)
            .take(limit);

        // 5. Ejecutar
        const [items, totalItems] = await queryBuilder.getManyAndCount();

        // 6. Mapear Respuesta
        const totalPages = Math.ceil(totalItems / limit);

        return {
            data: items,
            meta: {
                page,
                limit,
                total: totalItems,
                totalPages,
            },
        };
    }




    // ---------------------------------------------------------
    // 1. APROBAR (Solo Admin)
    // ---------------------------------------------------------
    async approve(id: number, processDto: ProcessRequestDto): Promise<Request> {
        const request = await this.requestRepository.findOneBy({ id });
        if (!request) throw new NotFoundException('Solicitud no encontrada');

        if (request.status !== RequestStatus.PENDING) {
            throw new BadRequestException(`No se puede aprobar una solicitud en estado ${request.status}`);
        }

        // Guardar el estado anterior
        const previousStatus = request.status;

        // 1. Actualizar estado
        request.status = RequestStatus.APPROVED;
        request.reviewerComment = processDto.reviewerComment || '';
        const savedRequest = await this.requestRepository.save(request);

        // 2. Emitir evento de cambio de estado
        this.eventEmitter.emit('request.status.changed', {
            request: savedRequest,
            previousStatus,
            newStatus: savedRequest.status,
        });

        // 3. Ejecutar lógica específica de la estrategia (Side Effects)
        const strategy = this.strategyFactory.getStrategy(request.type);
        await strategy.onApprove(savedRequest);

        return savedRequest;
    }

    // ---------------------------------------------------------
    // 2. RECHAZAR (Solo Admin)
    // ---------------------------------------------------------
    async reject(id: number, processDto: ProcessRequestDto): Promise<Request> {
        const request = await this.requestRepository.findOneBy({ id });
        if (!request) throw new NotFoundException('Solicitud no encontrada');

        if (request.status !== RequestStatus.PENDING) {
            throw new BadRequestException(`No se puede rechazar una solicitud en estado ${request.status}`);
        }

        // Guardar el estado anterior
        const previousStatus = request.status;

        // 1. Actualizar estado
        request.status = RequestStatus.REJECTED;
        request.reviewerComment = processDto.reviewerComment || ''; // Motivo del rechazo
        const savedRequest = await this.requestRepository.save(request);

        // 2. Emitir evento de cambio de estado
        this.eventEmitter.emit('request.status.changed', {
            request: savedRequest,
            previousStatus,
            newStatus: savedRequest.status,
        });

        // 3. Ejecutar lógica específica
        const strategy = this.strategyFactory.getStrategy(request.type);
        await strategy.onReject(savedRequest);

        return savedRequest;
    }

    // ---------------------------------------------------------
    // 3. CANCELAR (Solo Empleado - Dueño)
    // ---------------------------------------------------------
    async cancel(id: number, employeeId: string): Promise<Request> {
        const request = await this.requestRepository.findOneBy({ id });
        if (!request) throw new NotFoundException('Solicitud no encontrada');

        // Validar propiedad
        if (request.employeeId !== employeeId) {
            throw new ForbiddenException('No tienes permiso para cancelar esta solicitud.');
        }

        // Solo se puede cancelar si está pendiente
        if (request.status !== RequestStatus.PENDING) {
            throw new BadRequestException('Solo se pueden cancelar solicitudes pendientes. Contacte a RRHH.');
        }

        // Guardar el estado anterior
        const previousStatus = request.status;

        request.status = RequestStatus.CANCELLED;
        const savedRequest = await this.requestRepository.save(request);

        // Emitir evento de cambio de estado
        this.eventEmitter.emit('request.status.changed', {
            request: savedRequest,
            previousStatus,
            newStatus: savedRequest.status,
        });

        return savedRequest;
    }

    // ---------------------------------------------------------
    // 4. ACTUALIZAR (Solo Empleado - Dueño - Solo Pendientes)
    // ---------------------------------------------------------
    async update(id: number, employeeId: string, updateData: { details?: any }): Promise<Request> {
        const request = await this.requestRepository.findOneBy({ id });
        if (!request) throw new NotFoundException('Solicitud no encontrada');

        // Validar propiedad
        if (request.employeeId !== employeeId) {
            throw new ForbiddenException('No tienes permiso para actualizar esta solicitud.');
        }

        // Solo se puede actualizar si está pendiente
        if (request.status !== RequestStatus.PENDING) {
            throw new BadRequestException('Solo se pueden actualizar solicitudes pendientes.');
        }

        // Actualizar detalles si se proporcionan
        if (updateData.details) {
            request.details = {
                ...request.details,
                ...updateData.details
            };
        }

        return this.requestRepository.save(request);
    }

    // ... otros métodos (approve, reject)
}