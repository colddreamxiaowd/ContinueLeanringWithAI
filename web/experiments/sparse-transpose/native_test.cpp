#include <cassert>
#include <iostream>
#include <vector>
#include <algorithm>
extern "C" {
  int lab_reset(int,int);int lab_add(int,int,int);int lab_prepare();int lab_step();
  int lab_a(int,int);int lab_b(int,int);int lab_used(int);int lab_count();
  int lab_rows();int lab_cols();int lab_cnum(int);int lab_cpot(int);int lab_cpot_start(int);
}
struct Triple{int r,c,v;bool operator==(const Triple&b)const{return r==b.r&&c==b.c&&v==b.v;}};
int main(){
 assert(lab_reset(6,7)==0);
 std::vector<Triple> input{{0,1,12},{0,2,9},{2,0,-3},{2,5,14},{3,2,24},{4,1,18},{5,0,15},{5,3,-7}};
 for(auto t:input) assert(lab_add(t.r,t.c,t.v)>0);
 assert(lab_prepare()==8);
 int steps=0;while(true){int k=lab_step();++steps;if(k==4)break;assert(k>0&&steps<200);}
 assert(steps==24);
 std::vector<Triple> actual;for(int i=0;i<lab_count();++i){assert(lab_used(i));actual.push_back({lab_b(i,0),lab_b(i,1),lab_b(i,2)});}
 std::vector<Triple> expected;for(int col=0;col<lab_cols();++col)
  for(auto t:input)if(t.c==col)expected.push_back({t.c,t.r,t.v});
 assert(actual==expected);
 int expectedCnum[]={2,2,2,1,0,1,0},expectedStart[]={0,2,4,6,7,7,8};
 for(int col=0;col<7;++col){assert(lab_cnum(col)==expectedCnum[col]);assert(lab_cpot_start(col)==expectedStart[col]); assert(lab_cpot(col)==expectedStart[col]+expectedCnum[col]);}
 std::cout<<"PASS native C++ transpose: 6x7, nnz=8, steps=24\n";
 for(auto t:actual){std::cout<<"("<<t.r<<","<<t.c<<","<<t.v<<") ";}
 std::cout<<"\n";
}
