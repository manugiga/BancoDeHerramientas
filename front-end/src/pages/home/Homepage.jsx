import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { BookIcon, CircleAlertIcon, ClipboardIcon, PenToolIcon, TriangleAlertIcon, UserIcon, FileTextIcon, HomeIcon, SettingsIcon, XIcon, List, HandCoins  } from "lucide-react";
import { LuArrowDownLeftFromCircle } from "react-icons/lu";
import useGetData from "@/hooks/useGetData";
import InputPrestamo from '../Prestamos/InputPrestamo.jsx';
import { AiOutlineAlert } from "react-icons/ai";
import { CgReorder } from "react-icons/cg";
import { GiReturnArrow } from "react-icons/gi";
import { MdManageHistory } from "react-icons/md";

export const HomePage = () => {
  const { data: cantidadPrestamo } = useGetData(["prestamos/todosPrestamos"]);
  const { data: cantidadPrestamoEs } = useGetData(["prestamosEs/todosEspeciales"]);
  const { data: cantidadMora } = useGetData(["moras"]);
  const { data: cantidadDano } = useGetData(["danos"]);
  const { data: cantidadEncargo } = useGetData(["encargos/admin"]);
  const { data: prestamosData, error, loading } = useGetData(["historial"]);
  const prestamos = prestamosData['historial'] || [];
  const cantidadPrestamos = cantidadPrestamo['prestamos/todosPrestamos'] || [];
  const cantidadPrestamosEs = cantidadPrestamoEs['prestamosEs/todosEspeciales'] || [];
  const cantidadMoras = cantidadMora['moras'] || [];
  const totalMoras = cantidadMoras.length;
  const cantidadDanos = cantidadDano['danos'] || [];
  const totalDanos = cantidadDanos.length;
  const cantidadEncargos = cantidadEncargo['encargos/admin'] || [];
  const totalEncargos = cantidadEncargos.length;

  // Función para obtener el préstamo con la fecha más actual
  const getLatestPrestamos = () => {
    if (prestamos.length === 0) return [];
  
    // Encuentra la fecha más actual
    const maxDate = prestamos.reduce((max, prestamo) => {
      const fecha = new Date(prestamo.fecha_accion || 0);
      return fecha.getTime() > max.getTime() ? fecha : max;
    }, new Date(0)); // Valor inicial: la fecha más temprana posible
  
    // Filtra los préstamos que tienen la fecha máxima
    return prestamos.filter(prestamo => {
      const fecha = new Date(prestamo.fecha_accion || 0);
      return fecha.getTime() === maxDate.getTime();
    });
  };  

  const countPrestamosByState = (state) => {
    return cantidadPrestamos.filter(prestamo => prestamo.estado === state).length;
  };

  const countPrestamosEsByState = (state) => {
    return cantidadPrestamosEs.filter(prestamo => prestamo.estado === state).length;
  };

  const latestPrestamos = getLatestPrestamos();

  return (
    <>
      <section className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-5 ">
        {["Préstamos", "Encargos", "Moras", "Daños", "Préstamos Especiales"].map((item, index) => (
          <Card key={index} className="bg-primary text-primary-foreground">
            <CardHeader className="flex justify-between">
            <CardTitle>
              {item === "Préstamos" 
                ? countPrestamosByState("actual") 
                : item === "Préstamos Especiales" 
                ? countPrestamosEsByState("actual")
                : item === "Moras" 
                ? totalMoras 
                : item === "Daños"
                ? totalDanos
                : item === "Encargos"
                ? totalEncargos
                : 0} 
            </CardTitle>
              <Icon name={item} className="w-6 h-6" />
            </CardHeader>
            <CardContent>
              <CardDescription style={{ color: 'white' }}>{item}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="mt-6">
        <InputPrestamo/>
        <Card className="border-input">
          <div className="max-h-[200px] max-w-[2000px] overflow-y-auto overflow-x-auto">
          <Table>
          <TableHeader sx={{ color: 'white', textAlign: 'center' }}>
            <TableRow>
              <TableHead className="text-white text-center">Documento</TableHead>
              <TableHead className="text-white text-center">Usuario</TableHead>
              <TableHead className="text-white text-center">Elemento</TableHead>
              <TableHead className="text-white text-center">Cantidad</TableHead>
              <TableHead className="text-white text-center">Acción</TableHead>
              <TableHead className="text-white text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan="5">Cargando...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan="5">Error al cargar datos</TableCell>
                  </TableRow>
                    ) : latestPrestamos.length > 0 ? (
                      latestPrestamos.map((prestamo) => (
                        <TableRow key={prestamo.id_historial}>
                          <TableCell>{prestamo.cliente_id}</TableCell>
                          <TableCell>{prestamo.cliente_nombre}</TableCell>
                          <TableCell>{prestamo.elemento_descripcion}</TableCell>
                          <TableCell>{prestamo.cantidad}</TableCell>
                          <TableCell>{prestamo.accion}</TableCell>
                          <TableCell>{prestamo.estado}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                <TableRow>
                  <TableCell colSpan="5">No hay préstamos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </Card>
      </section>
    </>
  );
};

function Icon({ name, ...props }) {
  const icons = {
    "Inicio": <HomeIcon {...props} />,
    "Préstamos": <HandCoins {...props} />,
    "Consumos": <LuArrowDownLeftFromCircle {...props} />,
    "Encargos": <CgReorder {...props} />,
    "Moras": <AiOutlineAlert {...props} />,
    "Daños": <MdManageHistory {...props} />,
    "Elementos": <PenToolIcon {...props} />,
    "Lista": <List {...props} />,
    "Usuarios": <UserIcon {...props} />,
    "Roles": <FileTextIcon {...props} />,
    "Admin": <SettingsIcon {...props} />,
    "Préstamos Especiales": <GiReturnArrow {...props} />
  };
  return icons[name] || <XIcon {...props} />;
}
