import React from 'react';
import { Server, Cpu, Shield, Globe, Code, Mail } from 'lucide-react';

export const InfoTab: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 text-slate-300 font-sans max-w-4xl">
      {/* Header section - clean open typography */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl font-bold text-white tracking-wide">QuarkL Cloud</h1>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          Equipo especializado en tecnología, infraestructura cloud y sistemas de alto rendimiento.
        </p>
      </div>

      {/* About QuarkL Cloud */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
          Sobre la Empresa
        </h2>
        <p className="text-xs leading-relaxed text-slate-300">
          QuarkL Cloud es un equipo de ingeniería y desarrollo enfocado en proporcionar soluciones de tecnología avanzadas. Especializados en el despliegue de infraestructura en la nube, optimización de servidores, entrega de contenidos distribuida y desarrollo de herramientas de software personalizadas.
        </p>
        <p className="text-xs leading-relaxed text-slate-400">
          Nuestra misión es ofrecer plataformas estables, de baja latencia y alta disponibilidad para comunidades digitales, aplicaciones de escritorio y servicios en línea.
        </p>
      </div>

      <div className="border-t border-slate-800/60 pt-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
          Áreas de Especialización
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Server className="w-4 h-4 text-slate-400" />
              <span>Infraestructura Cloud</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-6">
              Servidores dedicados, alojamiento de alto rendimiento y arquitectura en la nube optimizada para cargas de trabajo exigentes.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Code className="w-4 h-4 text-slate-400" />
              <span>Desarrollo de Software</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-6">
              Lanzadores a medida, clientes de escritorio personalizados e integración de sistemas de sincronización de contenidos en tiempo real.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Seguridad & Mitigación</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-6">
              Protección anti-DDoS avanzada, filtrado de tráfico malicioso y cifrado de conexiones para garantizar disponibilidad continua.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Red Global & Redes CDN</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-6">
              Distribución acelerada de mods, texturas y archivos del juego con baja latencia mediante servidores distribuidos.
            </p>
          </div>
        </div>
      </div>

      {/* Project AvocadoMC Info */}
      <div className="border-t border-slate-800/60 pt-6 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
          Proyecto AvocadoMC
        </h2>
        <p className="text-xs leading-relaxed text-slate-300">
          AvocadoMC es la plataforma de lanzamiento oficial desarrollada por el equipo de QuarkL Cloud. Diseñada para proporcionar una experiencia de juego fluida, sincronización automática de modpacks mediante API de GitHub y gestión eficiente de recursos para Minecraft Java Edition.
        </p>
      </div>

      {/* System Technical Metadata */}
      <div className="border-t border-slate-800/60 pt-6 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
          Información del Sistema
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="block text-slate-500 text-[10px] uppercase">Desarrollador</span>
            <span className="text-slate-200 font-semibold">QuarkL Cloud</span>
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] uppercase">Versión</span>
            <span className="text-slate-200 font-semibold">1.0.0 Stable</span>
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] uppercase">Plataforma</span>
            <span className="text-slate-200 font-semibold">Electron / React</span>
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] uppercase">Sincronización</span>
            <span className="text-slate-200 font-semibold">GitHub Engine</span>
          </div>
        </div>
      </div>

      {/* Contact & Legal Footer */}
      <div className="border-t border-slate-800/60 pt-6 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>Soporte Técnico: soporte@quarkl.cloud</span>
        </div>
        <div>
          <span>QuarkL Cloud. Todos los derechos reservados.</span>
        </div>
      </div>
    </div>
  );
};
