'use client';
import AnimatedLogo from '@/components/AnimatedLogo';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { coursesApi } from '@/lib/api';
import { CreateCourseDto, CourseDetail } from '@/types';
import CourseForm from '../../_components/CourseForm';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { checkAuth } = useAuthStore();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadCourse();
  }, [id, checkAuth, router]);

  const loadCourse = async () => {
    try {
      setIsLoading(true);
      const res = await coursesApi.adminGetAll();
      const found = res.data.find(c => c.id === id);
      if (!found) { setLoadError('Course not found.'); return; }
      const detail = await coursesApi.getBySlug(found.slug);
      setCourse(detail.data);
    } catch {
      setLoadError('Error loading course.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CreateCourseDto) => {
    setIsSubmitting(true);
    try {
      await coursesApi.adminUpdate(id, data);
      setSuccessMsg('Course updated successfully!');
      setTimeout(() => router.push('/admin/courses'), 1000);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error while updating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col app-grid" style={{ backgroundColor: '#101b22', color: '#e2e8f0' }}>
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button onClick={() => router.push('/')} className="text-[#3caff6] font-bold flex items-center gap-1.5">
                <AnimatedLogo size={20} />
                CloudCode
              </button>
              <span>/</span>
              <button onClick={() => router.push('/admin/courses')} className="hover:text-white transition-colors">Courses</button>
              <span>/</span>
              <span className="text-white font-medium truncate max-w-[200px]">{course?.title ?? 'Edit'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">
          Edit: <span className="text-[#3caff6]">{course?.title}</span>
        </h1>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {successMsg}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#3caff6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{loadError}</p>
            <button onClick={() => router.push('/admin/courses')} className="text-[#3caff6] hover:underline text-sm">← Back to list</button>
          </div>
        ) : course ? (
          <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-6">
            <CourseForm initial={course} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
